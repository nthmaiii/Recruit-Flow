<?php

namespace App\Services;

use App\Models\Application;
use App\Models\EmailLog;
use App\Models\EmailTemplate;
use App\Models\Interview;

class EmailService
{
    public function buildVariables(Application $application, ?Interview $interview = null): array
    {
        $candidate = $application->candidate;
        $job = $application->job;

        $vars = [
            'candidate_name' => $candidate->full_name,
            'job_title' => $job->title,
            'company_name' => config('app.name', 'RecruitFlow'),
            'department' => $job->department->name ?? '',
        ];

        if ($interview) {
            $vars['interview_date'] = $interview->scheduled_at->format('d/m/Y H:i');
            $vars['interview_link'] = $interview->meeting_link ?? '';
            $vars['interview_location'] = $interview->location ?? '';
            $vars['interview_round'] = $interview->round;
            $vars['duration'] = $interview->duration_minutes . ' phút';
            $vars['confirmation_link'] = url('/api/v1/interviews/confirm/' . $interview->confirmation_token);
        }

        return $vars;
    }

    public function renderTemplate(string $type, array $variables): ?array
    {
        $template = EmailTemplate::where('type', $type)->first();
        if (!$template) {
            return null;
        }

        return [
            'subject' => $template->render($variables),
            'body' => $template->render($variables),
            'raw_subject' => $template->subject,
        ];
    }

    public function log(int $applicationId, string $email, string $type, string $subject): void
    {
        EmailLog::create([
            'application_id' => $applicationId,
            'candidate_email' => $email,
            'template_type' => $type,
            'subject' => $subject,
        ]);
    }
}
