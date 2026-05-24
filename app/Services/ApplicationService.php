<?php

namespace App\Services;

use App\Models\Application;
use App\Models\ApplicationStatusHistory;
use App\Models\AppNotification;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ApplicationService
{
    public function changeStatus(Application $application, array $data, User $actor): Application
    {
        return DB::transaction(function () use ($application, $data, $actor) {
            $fromStatus = $application->status;
            $toStatus = $data['status'];

            ApplicationStatusHistory::create([
                'application_id' => $application->id,
                'from_status' => $fromStatus,
                'to_status' => $toStatus,
                'note' => $data['note'],
                'rejection_reason' => $data['rejection_reason'] ?? null,
                'changed_by' => $actor->id,
            ]);

            $application->update(['status' => $toStatus]);

            // Notify candidate for certain transitions
            $notifyCandidate = ['offer', 'rejected', 'hired'];
            if (in_array($toStatus, $notifyCandidate)) {
                $candidateUserId = $application->candidate->user_id;
                AppNotification::create([
                    'user_id' => $candidateUserId,
                    'type' => 'application_status_changed',
                    'data' => [
                        'application_id' => $application->id,
                        'status' => $toStatus,
                        'job_title' => $application->job->title,
                    ],
                ]);
            }

            return $application;
        });
    }
}
