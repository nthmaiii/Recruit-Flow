<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Job;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function dashboard(Request $request)
    {
        $user = $request->user();

        $appQuery = Application::query();
        $jobQuery = Job::query();

        if ($user->isHM()) {
            $appQuery->whereHas('job', fn($q) => $q->where('department_id', $user->department_id));
            $jobQuery->where('department_id', $user->department_id);
        }

        $statusCounts = (clone $appQuery)
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status');

        $trend = (clone $appQuery)
            ->where('created_at', '>=', now()->subDays(30))
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as count'))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $needsAction = (clone $appQuery)
            ->with(['candidate', 'job'])
            ->whereIn('status', [Application::STATUS_NEW, Application::STATUS_INTERVIEWED])
            ->orderBy('created_at')
            ->limit(10)
            ->get();

        $upcomingInterviews = [];
        if ($user->isHM()) {
            $upcomingInterviews = \App\Models\Interview::with(['application.candidate', 'application.job'])
                ->where('interviewer_id', $user->id)
                ->where('scheduled_at', '>=', now())
                ->where('scheduled_at', '<=', now()->addDays(7))
                ->where('status', '!=', 'cancelled')
                ->orderBy('scheduled_at')
                ->get();
        }

        return response()->json([
            'total_applications' => (clone $appQuery)->count(),
            'total_jobs' => $jobQuery->where('status', 'published')->count(),
            'hired_this_month' => (clone $appQuery)->where('status', 'hired')
                ->whereMonth('updated_at', now()->month)->count(),
            'status_counts' => $statusCounts,
            'trend' => $trend,
            'needs_action' => $needsAction,
            'upcoming_interviews' => $upcomingInterviews,
        ]);
    }

    public function applications(Request $request)
    {
        $query = Application::with(['job', 'candidate'])
            ->when($request->from_date, fn($q) => $q->where('created_at', '>=', $request->from_date))
            ->when($request->to_date, fn($q) => $q->where('created_at', '<=', $request->to_date))
            ->when($request->job_id, fn($q) => $q->where('job_id', $request->job_id));

        return response()->json($query->paginate(20));
    }

    public function hiringFunnel(Request $request)
    {
        $statuses = [
            Application::STATUS_NEW, Application::STATUS_REVIEWING,
            Application::STATUS_INTERVIEW_SCHEDULED, Application::STATUS_INTERVIEWED,
            Application::STATUS_OFFER_SENT, Application::STATUS_HIRED, Application::STATUS_REJECTED,
        ];

        $counts = Application::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status');

        $funnel = collect($statuses)->map(fn($s) => [
            'status' => $s,
            'count' => $counts[$s] ?? 0,
        ]);

        return response()->json($funnel);
    }
}
