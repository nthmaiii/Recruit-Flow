<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\SendEmailJob;
use App\Models\ActivityLog;
use App\Models\AppNotification;
use App\Models\Application;
use App\Models\Interview;
use App\Models\InterviewEvaluation;
use App\Services\InterviewService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InterviewController extends Controller
{
    public function __construct(private InterviewService $service) {}

    public function schedule(Request $request, Application $application): JsonResponse
    {
        $validated = $request->validate([
            'round' => 'required|integer|min:1|max:5',
            'interviewer_id' => 'required|exists:users,id',
            'scheduled_at' => 'required|date|after:' . now()->addHour()->toDateTimeString(),
            'duration_minutes' => 'required|in:30,60,90',
            'location' => 'nullable|string|max:255',
            'meeting_link' => 'nullable|url|max:500',
        ]);

        $interview = $this->service->schedule($application, $validated, $request->user());

        ActivityLog::record($request->user()->id, 'schedule_interview',
            "Scheduled interview round {$validated['round']} for application #{$application->id}");

        return response()->json($interview->load('interviewer', 'application.candidate.user'), 201);
    }

    public function evaluate(Request $request, Interview $interview): JsonResponse
    {
        $user = $request->user();

        if ($interview->interviewer_id !== $user->id && !in_array($user->role, ['SA', 'HR'])) {
            return response()->json(['message' => 'Chỉ người phỏng vấn mới có thể đánh giá.'], 403);
        }

        if ($interview->evaluation) {
            return response()->json(['message' => 'Đã có đánh giá cho buổi phỏng vấn này.'], 422);
        }

        $validated = $request->validate([
            'technical_score' => 'required|integer|between:1,5',
            'soft_score' => 'required|integer|between:1,5',
            'comment' => 'required|string|min:10',
            'recommendation' => 'required|in:pass,fail',
        ]);

        $evaluation = $this->service->evaluate($interview, $validated, $user);

        ActivityLog::record($user->id, 'evaluate_interview',
            "Evaluated interview #{$interview->id}: {$validated['recommendation']}");

        return response()->json($evaluation->load('evaluator'));
    }

    public function confirmInterview(string $token): JsonResponse
    {
        $interview = Interview::where('confirmation_token', $token)
            ->whereNull('confirmed_at')
            ->first();

        if (!$interview) {
            return response()->json(['message' => 'Link xác nhận không hợp lệ hoặc đã sử dụng.'], 404);
        }

        $interview->update([
            'confirmed_at' => now(),
            'status' => 'confirmed',
        ]);

        // Notify interviewer
        AppNotification::create([
            'user_id' => $interview->interviewer_id,
            'type' => 'interview_confirmed',
            'data' => [
                'interview_id' => $interview->id,
                'candidate_name' => $interview->application->candidate->full_name,
            ],
        ]);

        event(new \App\Events\InterviewConfirmed($interview));

        return response()->json(['message' => 'Xác nhận tham gia phỏng vấn thành công.']);
    }

    public function mySchedule(Request $request): JsonResponse
    {
        $interviews = Interview::with(['application.candidate.user', 'application.job'])
            ->where('interviewer_id', $request->user()->id)
            ->where('scheduled_at', '>=', now())
            ->where('status', '!=', 'cancelled')
            ->orderBy('scheduled_at')
            ->get();

        return response()->json($interviews);
    }
}
