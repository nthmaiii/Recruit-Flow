<?php

namespace App\Jobs;

use App\Models\Application;
use App\Models\EmailLog;
use App\Models\EmailTemplate;
use App\Models\Interview;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        protected Application $application,
        protected string $templateCode,
        protected ?string $customMessage = null,
        protected ?Interview $interview = null
    ) {}

    public function handle(): void
    {
        $template = EmailTemplate::where('code', $this->templateCode)->where('is_active', true)->first();

        if (!$template) return;

        $candidate = $this->application->candidate;
        $job = $this->application->job;

        $data = [
            'candidate_name'  => $candidate->full_name,
            'job_title'       => $job->title,
            'company_name'    => config('app.name'),
            'custom_message'  => $this->customMessage ?? '',
            'application_id'  => $this->application->id,
            // Defaults nếu không có interview
            'interview_date'     => '',
            'interview_duration' => '',
            'interview_type'     => '',
            'interview_location' => '',
            'meeting_link'       => '',
            'confirmation_link'  => '',
        ];

        if ($this->interview) {
            $typeLabel = $this->interview->type === 'online' ? 'Online' : 'Trực tiếp';
            $data['interview_date']     = $this->interview->scheduled_at->format('H:i, d/m/Y');
            $data['interview_duration'] = $this->interview->duration_minutes . ' phút';
            $data['interview_type']     = $typeLabel;
            $data['interview_location'] = $this->interview->location ?? '';
            $data['meeting_link']       = $this->interview->meeting_link ?? '';
            $data['confirmation_link']  = $this->interview->getConfirmationUrl();
        }

        ['subject' => $subject, 'body' => $body] = $template->render($data);

        try {
            Mail::html($body, function ($message) use ($candidate, $subject) {
                $message->to($candidate->email, $candidate->full_name)->subject($subject);
            });

            EmailLog::create([
                'application_id' => $this->application->id,
                'to_email'       => $candidate->email,
                'to_name'        => $candidate->full_name,
                'subject'        => $subject,
                'body'           => $body,
                'template_code'  => $this->templateCode,
                'status'         => 'sent',
            ]);
        } catch (\Exception $e) {
            EmailLog::create([
                'application_id' => $this->application->id,
                'to_email'       => $candidate->email,
                'to_name'        => $candidate->full_name,
                'subject'        => $subject,
                'body'           => $body,
                'template_code'  => $this->templateCode,
                'status'         => 'failed',
                'error_message'  => $e->getMessage(),
            ]);
        }
    }
}
