<?php

namespace App\Services;

use App\Jobs\SendEmailJob;
use App\Models\Application;
use App\Models\AppNotification;
use App\Models\Interview;
use App\Models\InterviewEvaluation;
use App\Models\User;
use App\Services\ApplicationService;
use Illuminate\Support\Facades\DB;

class InterviewService
{
    public function __construct(private ApplicationService $applicationService) {}

    public function schedule(Application $application, array $data, User $creator): Interview
    {
        return DB::transaction(function () use ($application, $data, $creator) {
            // Check for scheduling conflicts
            $conflict = Interview::where('application_id', $application->id)
                ->where('scheduled_at', $data['scheduled_at'])
                ->where('status', '!=', 'cancelled')
                ->exists();

            if ($conflict) {
                throw new \InvalidArgumentException('Ứng viên đã có lịch phỏng vấn vào thời gian này.');
            }

            $interview = Interview::create([
                'application_id' => $application->id,
                'round' => $data['round'],
                'interviewer_id' => $data['interviewer_id'],
                'scheduled_at' => $data['scheduled_at'],
                'duration_minutes' => $data['duration_minutes'],
                'location' => $data['location'] ?? null,
                'meeting_link' => $data['meeting_link'] ?? null,
                'created_by' => $creator->id,
                'status' => 'scheduled',
            ]);

            // Update application status
            $this->applicationService->changeStatus($application, [
                'status' => 'interview_scheduled',
                'note' => "Lên lịch phỏng vấn vòng {$data['round']}",
            ], $creator);

            // Send invitation email to candidate
            dispatch(new SendEmailJob($application, 'interview_invitation', null, $interview));

            // Notify interviewer
            AppNotification::create([
                'user_id' => $data['interviewer_id'],
                'type' => 'interview_scheduled',
                'data' => [
                    'interview_id' => $interview->id,
                    'candidate_name' => $application->candidate->full_name,
                    'scheduled_at' => $interview->scheduled_at->toIso8601String(),
                    'job_title' => $application->job->title,
                ],
            ]);

            event(new \App\Events\ApplicationStatusChanged($application, 'interview_scheduled'));

            return $interview;
        });
    }

    public function evaluate(Interview $interview, array $data, User $evaluator): InterviewEvaluation
    {
        return DB::transaction(function () use ($interview, $data, $evaluator) {
            $evaluation = InterviewEvaluation::create([
                'interview_id' => $interview->id,
                'technical_score' => $data['technical_score'],
                'soft_score' => $data['soft_score'],
                'comment' => $data['comment'],
                'recommendation' => $data['recommendation'],
                'evaluated_by' => $evaluator->id,
            ]);

            $interview->update(['status' => 'completed']);

            $application = $interview->application;
            $avgScore = round(($data['technical_score'] + $data['soft_score']) / 2, 1);
            $application->update(['rating_avg' => $avgScore]);

            // Auto-transition based on recommendation
            if ($data['recommendation'] === 'pass') {
                $this->applicationService->changeStatus($application, [
                    'status' => 'offer',
                    'note' => "Đạt phỏng vấn vòng {$interview->round}. Điểm TB: {$avgScore}",
                ], $evaluator);
            } else {
                $this->applicationService->changeStatus($application, [
                    'status' => 'rejected',
                    'note' => "Không đạt phỏng vấn vòng {$interview->round}. Điểm TB: {$avgScore}",
                    'rejection_reason' => 'Thiếu kỹ năng',
                ], $evaluator);
            }

            return $evaluation;
        });
    }
}
