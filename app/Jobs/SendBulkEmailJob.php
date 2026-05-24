<?php

namespace App\Jobs;

use App\Models\Application;
use App\Services\EmailService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendBulkEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(
        private array $applicationIds,
        private string $templateType
    ) {}

    public function handle(): void
    {
        foreach ($this->applicationIds as $id) {
            $application = Application::find($id);
            if ($application) {
                dispatch(new SendEmailJob($application, $this->templateType));
            }
        }
    }
}
