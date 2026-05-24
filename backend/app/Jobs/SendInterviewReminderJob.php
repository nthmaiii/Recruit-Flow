<?php

namespace App\Jobs;

use App\Models\Interview;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendInterviewReminderJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        $interviews = Interview::with(['application.candidate', 'application.job', 'interviewer'])
            ->whereBetween('scheduled_at', [now()->addHours(23), now()->addHours(25)])
            ->whereIn('status', ['pending', 'confirmed'])
            ->get();

        foreach ($interviews as $interview) {
            $candidate = $interview->application->candidate;
            $job = $interview->application->job;

            $body = "
                <p>Xin chào {$candidate->full_name},</p>
                <p>Nhắc nhở: Bạn có lịch phỏng vấn cho vị trí <strong>{$job->title}</strong> vào lúc
                <strong>{$interview->scheduled_at->format('d/m/Y H:i')}</strong>.</p>
                <p>Loại: {$interview->type}</p>
                " . ($interview->meeting_link ? "<p>Link: {$interview->meeting_link}</p>" : "") . "
                <p>Chúc bạn may mắn!</p>
            ";

            Mail::html($body, function ($message) use ($candidate, $job) {
                $message->to($candidate->email, $candidate->full_name)
                    ->subject("Nhắc nhở phỏng vấn: {$job->title}");
            });
        }
    }
}
