<?php

namespace App\Http\Middleware;

use App\Models\Job;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckDepartmentAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (in_array($user->role, ['SA', 'HR'])) {
            return $next($request);
        }

        // HM: only allow access to jobs in their department
        if ($user->role === 'HM') {
            $jobId = $request->route('job') ?? $request->route('job_id');

            if ($jobId) {
                $job = $jobId instanceof Job ? $jobId : Job::find($jobId);
                if ($job && $job->department_id !== $user->department_id) {
                    return response()->json(['message' => 'Access denied to this department resource'], 403);
                }
            }
        }

        return $next($request);
    }
}
