<?php

namespace App\Jobs;

use App\Models\Application;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class EvaluateApplicationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;
    public int $timeout = 90;

    public function __construct(public readonly int $applicationId) {}

    public function handle(): void
    {
        $application = Application::with(['job.department', 'candidate'])->find($this->applicationId);
        if (!$application) return;

        $apiKey = config('services.gemini.api_key');
        if (!$apiKey) {
            Log::warning('EvaluateApplicationJob: GEMINI_API_KEY chưa được cấu hình.');
            return;
        }

        $job = $application->job;
        $candidate = $application->candidate;

        $jobContext = implode("\n", array_filter([
            "Vị trí tuyển dụng: {$job->title}",
            $job->department ? "Phòng ban: {$job->department->name}" : null,
            $job->level ? "Cấp độ: {$job->level}" : null,
            $job->type ? "Loại hình: {$job->type}" : null,
            "\nYêu cầu công việc:\n{$job->requirements}",
            $job->description ? "\nMô tả công việc:\n{$job->description}" : null,
        ]));

        $candidateInfo = "Họ tên ứng viên: {$candidate->full_name}";
        if ($candidate->email) $candidateInfo .= "\nEmail: {$candidate->email}";
        if ($application->cover_letter) {
            $candidateInfo .= "\n\nThư giới thiệu:\n{$application->cover_letter}";
        }

        $systemPrompt = <<<'EOT'
Bạn là chuyên gia HR với nhiều năm kinh nghiệm tuyển dụng tại Việt Nam. Nhiệm vụ của bạn là đánh giá mức độ phù hợp của ứng viên với vị trí tuyển dụng.

Trả về CHÍNH XÁC một JSON object (không có text nào khác, không có markdown code block) theo format sau:
{
  "score": <số nguyên 0-100>,
  "recommendation": "<strong_yes | yes | maybe | no>",
  "summary": "<nhận xét tổng quan 2-3 câu bằng tiếng Việt>",
  "strengths": ["<điểm mạnh 1>", "<điểm mạnh 2>", "<điểm mạnh 3>"],
  "weaknesses": ["<điểm yếu/thiếu hụt 1>", "<điểm yếu/thiếu hụt 2>"]
}

Quy tắc đánh giá recommendation:
- strong_yes: 80-100 điểm — rất phù hợp, ưu tiên phỏng vấn ngay
- yes: 60-79 điểm — phù hợp, nên phỏng vấn
- maybe: 40-59 điểm — có thể xem xét tùy nhu cầu cụ thể
- no: dưới 40 điểm — không phù hợp với vị trí này
EOT;

        $promptText = "=== THÔNG TIN CÔNG VIỆC ===\n{$jobContext}\n\n=== THÔNG TIN ỨNG VIÊN ===\n{$candidateInfo}\n\n=== FILE CV ===\n(xem file đính kèm bên dưới)";

        $parts = [['text' => $promptText]];

        // Đính kèm CV nếu là PDF
        if ($application->cv_path && Storage::disk('private')->exists($application->cv_path)) {
            $ext = strtolower(pathinfo($application->cv_path, PATHINFO_EXTENSION));
            if ($ext === 'pdf') {
                $parts[] = [
                    'inline_data' => [
                        'mime_type' => 'application/pdf',
                        'data'      => base64_encode(Storage::disk('private')->get($application->cv_path)),
                    ],
                ];
            } else {
                $parts[] = ['text' => "(CV dạng {$ext} — {$application->cv_original_name}. Hãy đánh giá dựa trên thông tin thư giới thiệu và thông tin có sẵn.)"];
            }
        }

        $response = Http::timeout(80)->post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key={$apiKey}",
            [
                'system_instruction' => [
                    'parts' => [['text' => $systemPrompt]],
                ],
                'contents' => [
                    ['role' => 'user', 'parts' => $parts],
                ],
                'generationConfig' => [
                    'temperature'     => 0.2,
                    'maxOutputTokens' => 1024,
                ],
            ]
        );

        if (!$response->successful()) {
            $errBody = substr($response->body(), 0, 300);
            Log::error("EvaluateApplicationJob: Gemini API failed for #{$this->applicationId}", [
                'status' => $response->status(),
                'body'   => $errBody,
            ]);
            throw new \RuntimeException("Gemini API trả lỗi {$response->status()}: {$errBody}");
        }

        $text = $response->json('candidates.0.content.parts.0.text', '');

        // Gemini đôi khi bọc trong ```json ... ```
        if (preg_match('/```(?:json)?\s*(\{.*?\})\s*```/s', $text, $m)) {
            $evaluation = json_decode($m[1], true);
        } elseif (preg_match('/\{.*\}/s', $text, $m)) {
            $evaluation = json_decode($m[0], true);
        } else {
            $evaluation = json_decode($text, true);
        }

        if (!is_array($evaluation) || !isset($evaluation['score'])) {
            Log::error("EvaluateApplicationJob: parse failed for #{$this->applicationId}", ['text' => $text]);
            throw new \RuntimeException("Không parse được JSON từ Gemini. Response: " . substr($text, 0, 200));
        }

        $evaluation['score'] = max(0, min(100, (int) $evaluation['score']));

        DB::table('applications')
            ->where('id', $this->applicationId)
            ->update([
                'ai_score'        => $evaluation['score'],
                'ai_evaluation'   => json_encode($evaluation, JSON_UNESCAPED_UNICODE),
                'ai_evaluated_at' => now(),
            ]);
    }
}
