<?php

namespace App\Console;

use App\Jobs\SendInterviewReminderJob;
use App\Models\Interview;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    protected function schedule(Schedule $schedule): void
    {
        // Send interview reminders every hour
        $schedule->call(function () {
            $upcoming = Interview::with(['application.candidate.user', 'application.job'])
                ->where('scheduled_at', '>=', now())
                ->where('scheduled_at', '<=', now()->addHour())
                ->where('status', 'confirmed')
                ->whereNull('reminder_sent_at')
                ->get();

            foreach ($upcoming as $interview) {
                dispatch(new SendInterviewReminderJob($interview));
            }
        })->hourly()->name('send-interview-reminders');

        // Database backup daily at 2 AM
        $schedule->command('backup:run')->dailyAt('02:00');
    }

    protected function commands(): void
    {
        $this->load(__DIR__ . '/Commands');
        require base_path('routes/console.php');
    }
}
