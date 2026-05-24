<?php

namespace App\Jobs;

use App\Models\Application;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendBulkEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        protected array $applicationIds,
        protected string $templateCode,
        protected ?string $customMessage = null
    ) {}

    public function handle(): void
    {
        Application::with(['candidate', 'job'])
            ->whereIn('id', $this->applicationIds)
            ->each(function (Application $application) {
                dispatch(new SendEmailJob($application, $this->templateCode, $this->customMessage));
            });
    }
}
