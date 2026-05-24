<?php

namespace App\Events;

use App\Models\Application;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NewApplicationEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Application $application) {}

    public function broadcastOn(): array
    {
        return [new Channel('hr-notifications')];
    }

    public function broadcastAs(): string
    {
        return 'new-application';
    }

    public function broadcastWith(): array
    {
        return [
            'application_id' => $this->application->id,
            'candidate_name' => $this->application->candidate->full_name,
            'job_title' => $this->application->job->title,
        ];
    }
}
