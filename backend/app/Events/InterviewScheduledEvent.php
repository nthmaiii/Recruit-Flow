<?php

namespace App\Events;

use App\Models\Interview;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class InterviewScheduledEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Interview $interview) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('hr-notifications'),
            new Channel("user.{$this->interview->interviewer_id}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'interview-scheduled';
    }

    public function broadcastWith(): array
    {
        return [
            'interview_id' => $this->interview->id,
            'candidate_name' => $this->interview->application->candidate->full_name,
            'job_title' => $this->interview->application->job->title,
            'scheduled_at' => $this->interview->scheduled_at,
        ];
    }
}
