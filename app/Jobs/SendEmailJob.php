<?php

namespace App\Jobs;

use App\Models\Application;
use App\Models\EmailLog;
use App\Models\EmailTemplate;
use App\Models\Interview;
use App\Services\EmailService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 60;

    public function __construct(
        private Application $application,
        private string $templateType,
        private ?string $tempPassword = null,
        private ?Interview $interview = null
    ) {}

    public function handle(EmailService $emailService): void
    {
        $candidate = $this->application->candidate;
        $candidateEmail = $candidate->user->email;

        $variables = $emailService->buildVariables($this->application, $this->interview);

        if ($this->tempPassword) {
            $variables['temp_password'] = $this->tempPassword;
            $variables['login_url'] = url('/candidate/login');
        }

        $rendered = $emailService->renderTemplate($this->templateType, $variables);
        if (!$rendered) {
            return;
        }

        Mail::send([], [], function ($message) use ($candidateEmail, $rendered) {
            $message->to($candidateEmail)
                ->subject($rendered['raw_subject'])
                ->html($rendered['body']);
        });

        $emailService->log(
            $this->application->id,
            $candidateEmail,
            $this->templateType,
            $rendered['raw_subject']
        );
    }
}
