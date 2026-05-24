<?php

namespace App\Jobs;

use App\Models\Interview;
use App\Services\EmailService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendInterviewReminderJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(private Interview $interview) {}

    public function handle(EmailService $emailService): void
    {
        $application = $this->interview->application;
        $variables = $emailService->buildVariables($application, $this->interview);
        $variables['reminder_note'] = 'Nhắc nhở: Bạn có lịch phỏng vấn trong vòng 1 giờ nữa.';

        $rendered = $emailService->renderTemplate('interview_invitation', $variables);
        if (!$rendered) {
            return;
        }

        $candidateEmail = $application->candidate->user->email;
        Mail::send([], [], function ($message) use ($candidateEmail, $rendered) {
            $message->to($candidateEmail)
                ->subject('[Nhắc nhở] ' . $rendered['raw_subject'])
                ->html($rendered['body']);
        });
    }
}
