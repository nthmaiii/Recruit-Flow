<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Job;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;
use Barryvdh\DomPDF\Facade\Pdf;

class ReportController extends Controller
{
    public function hiring(Request $request): JsonResponse
    {
        $request->validate([
            'period' => 'nullable|in:month,quarter',
            'year' => 'nullable|integer|min:2020',
        ]);

        $year = $request->get('year', now()->year);
        $period = $request->get('period', 'month');

        if ($period === 'month') {
            $groupFormat = '%Y-%m';
            $label = 'month';
        } else {
            $groupFormat = '%Y-Q';
            $label = 'quarter';
        }

        $stats = DB::table('applications')
            ->join('jobs', 'applications.job_id', '=', 'jobs.id')
            ->selectRaw("DATE_FORMAT(applications.applied_at, '{$groupFormat}') as period")
            ->selectRaw('COUNT(applications.id) as total_applications')
            ->selectRaw('SUM(CASE WHEN applications.status = "hired" THEN 1 ELSE 0 END) as hired')
            ->selectRaw('AVG(CASE WHEN applications.status = "hired" THEN DATEDIFF(applications.updated_at, applications.applied_at) ELSE NULL END) as avg_time_to_hire')
            ->whereYear('applications.applied_at', $year)
            ->groupByRaw("DATE_FORMAT(applications.applied_at, '{$groupFormat}')")
            ->orderByRaw("DATE_FORMAT(applications.applied_at, '{$groupFormat}')")
            ->get();

        $jobStats = DB::table('jobs')
            ->selectRaw("DATE_FORMAT(created_at, '{$groupFormat}') as period")
            ->selectRaw('COUNT(*) as total_jobs')
            ->whereYear('created_at', $year)
            ->where('status', '!=', 'draft')
            ->groupByRaw("DATE_FORMAT(created_at, '{$groupFormat}')")
            ->orderByRaw("DATE_FORMAT(created_at, '{$groupFormat}')")
            ->get();

        return response()->json([
            'application_stats' => $stats,
            'job_stats' => $jobStats,
        ]);
    }

    public function exportExcel(Request $request)
    {
        return Excel::download(
            new \App\Exports\HiringReportExport($request->all()),
            'hiring-report-' . now()->format('Y-m-d') . '.xlsx'
        );
    }

    public function exportPdf(Request $request)
    {
        $data = $this->hiring($request)->getData(true);
        $pdf = Pdf::loadView('reports.hiring', $data);
        return $pdf->download('hiring-report-' . now()->format('Y-m-d') . '.pdf');
    }
}
