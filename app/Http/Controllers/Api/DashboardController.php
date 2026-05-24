<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Interview;
use App\Models\Job;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function hrDashboard(Request $request): JsonResponse
    {
        $openJobs = Job::where('status', 'published')->count();
        $newApplications24h = Application::where('applied_at', '>=', now()->subDay())->count();

        // Conversion rate: hired / total (non-draft jobs)
        $totalApps = Application::count();
        $hiredApps = Application::where('status', 'hired')->count();
        $conversionRate = $totalApps > 0 ? round(($hiredApps / $totalApps) * 100, 1) : 0;

        // Average time to hire (days)
        $avgTimeToHire = Application::where('status', 'hired')
            ->selectRaw('AVG(DATEDIFF(updated_at, applied_at)) as avg_days')
            ->value('avg_days') ?? 0;

        // Applications by status
        $byStatus = Application::selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        // Applications last 30 days
        $last30Days = Application::selectRaw('DATE(applied_at) as date, COUNT(*) as count')
            ->where('applied_at', '>=', now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Top 5 unreviewed applications
        $pending = Application::with(['candidate', 'job'])
            ->where('status', 'new')
            ->orderBy('applied_at', 'desc')
            ->limit(5)
            ->get();

        return response()->json([
            'open_jobs' => $openJobs,
            'new_applications_24h' => $newApplications24h,
            'conversion_rate' => $conversionRate,
            'avg_time_to_hire' => round($avgTimeToHire, 1),
            'by_status' => $byStatus,
            'last_30_days' => $last30Days,
            'pending_applications' => $pending,
        ]);
    }

    public function hmDashboard(Request $request): JsonResponse
    {
        $user = $request->user();
        $departmentId = $user->department_id;

        $jobIds = Job::where('department_id', $departmentId)->pluck('id');

        $awaitingInterview = Application::whereIn('job_id', $jobIds)
            ->where('status', 'interview_scheduled')
            ->count();

        $needsEvaluation = Application::whereIn('job_id', $jobIds)
            ->where('status', 'interviewed')
            ->count();

        $upcomingInterviews = Interview::with(['application.candidate', 'application.job'])
            ->where('interviewer_id', $user->id)
            ->where('scheduled_at', '>=', now())
            ->where('scheduled_at', '<=', now()->addDays(7))
            ->where('status', '!=', 'cancelled')
            ->orderBy('scheduled_at')
            ->get();

        return response()->json([
            'awaiting_interview' => $awaitingInterview,
            'needs_evaluation' => $needsEvaluation,
            'upcoming_interviews' => $upcomingInterviews,
        ]);
    }
}
