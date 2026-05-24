<?php

namespace App\Events;

use App\Models\Interview;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class InterviewConfirmed implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Interview $interview) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->interview->interviewer_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'interview-confirmed';
    }

    public function broadcastWith(): array
    {
        return [
            'interview_id' => $this->interview->id,
            'candidate_name' => $this->interview->application->candidate->full_name,
            'scheduled_at' => $this->interview->scheduled_at->toIso8601String(),
        ];
    }
}
