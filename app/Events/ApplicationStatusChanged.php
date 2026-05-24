<?php

namespace App\Events;

use App\Models\Application;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ApplicationStatusChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Application $application,
        public string $newStatus
    ) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('hr-notifications'),
            new PrivateChannel('user.' . $this->application->candidate->user_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'status-changed';
    }

    public function broadcastWith(): array
    {
        return [
            'application_id' => $this->application->id,
            'status' => $this->newStatus,
            'job_title' => $this->application->job->title,
            'candidate_name' => $this->application->candidate->full_name,
        ];
    }
}
