<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Job;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class JobController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Job::with(['department', 'creator'])
            ->withCount('applications');

        $user = $request->user();
        if ($user->role === 'HM') {
            $query->where('department_id', $user->department_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('department_id')) {
            $query->where('department_id', $request->department_id);
        }
        if ($request->filled('search')) {
            $query->where('title', 'like', '%' . $request->search . '%');
        }

        $jobs = $query->orderBy('created_at', 'desc')->paginate(15);

        return response()->json($jobs);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'department_id' => 'required|exists:departments,id',
            'quantity' => 'required|integer|min:1',
            'description' => 'required|string',
            'requirements' => 'required|string',
            'location' => 'nullable|string|max:255',
            'salary_range' => 'nullable|string|max:100',
            'deadline' => 'required|date|after_or_equal:today',
            'status' => 'in:draft,published',
        ]);

        // Check unique title among published jobs
        if (($validated['status'] ?? 'draft') === 'published') {
            $exists = Job::where('title', $validated['title'])
                ->where('status', 'published')
                ->exists();
            if ($exists) {
                return response()->json([
                    'message' => 'Tiêu đề đã tồn tại trong tin đang đăng.',
                ], 422);
            }
        }

        $validated['created_by'] = $request->user()->id;
        $validated['location'] = $validated['location'] ?? 'Van phong HCM';

        $job = Job::create($validated);

        ActivityLog::record($request->user()->id, 'create_job', "Created job: {$job->title}");

        return response()->json($job->load('department', 'creator'), 201);
    }

    public function show(Request $request, Job $job): JsonResponse
    {
        $user = $request->user();
        if ($user->role === 'HM' && $job->department_id !== $user->department_id) {
            return response()->json(['message' => 'Access denied'], 403);
        }

        return response()->json($job->load('department', 'creator')->loadCount('applications'));
    }

    public function update(Request $request, Job $job): JsonResponse
    {
        $hasApplications = $job->hasApplications();

        if ($hasApplications) {
            // Restricted fields when applications exist
            $validated = $request->validate([
                'description' => 'sometimes|string',
                'requirements' => 'sometimes|string',
                'deadline' => 'sometimes|date|after_or_equal:today',
                'salary_range' => 'nullable|string|max:100',
                'location' => 'nullable|string|max:255',
            ]);
        } else {
            $validated = $request->validate([
                'title' => 'sometimes|string|max:255',
                'department_id' => 'sometimes|exists:departments,id',
                'quantity' => 'sometimes|integer|min:1',
                'description' => 'sometimes|string',
                'requirements' => 'sometimes|string',
                'location' => 'nullable|string|max:255',
                'salary_range' => 'nullable|string|max:100',
                'deadline' => 'sometimes|date|after_or_equal:today',
                'status' => 'sometimes|in:draft,published,closed',
            ]);
        }

        $job->update($validated);

        ActivityLog::record($request->user()->id, 'update_job', "Updated job: {$job->title}");

        return response()->json($job->fresh(['department', 'creator']));
    }

    public function destroy(Request $request, Job $job): JsonResponse
    {
        if ($job->hasApplications()) {
            return response()->json([
                'message' => 'Không thể xóa tin đã có hồ sơ ứng tuyển.',
            ], 422);
        }

        ActivityLog::record($request->user()->id, 'delete_job', "Deleted job: {$job->title}");
        $job->delete();

        return response()->json(['message' => 'Đã xóa tin tuyển dụng.']);
    }

    public function duplicate(Request $request, Job $job): JsonResponse
    {
        $newJob = $job->replicate();
        $newJob->title = $job->title . ' (copy)';
        $newJob->status = 'draft';
        $newJob->slug = Job::generateSlug($newJob->title);
        $newJob->created_by = $request->user()->id;
        $newJob->save();

        ActivityLog::record($request->user()->id, 'duplicate_job', "Duplicated job: {$job->title}");

        return response()->json($newJob->load('department'), 201);
    }

    public function close(Request $request, Job $job): JsonResponse
    {
        if ($job->status !== 'published') {
            return response()->json(['message' => 'Chỉ có thể đóng tin đang đăng.'], 422);
        }

        $job->update(['status' => 'closed']);

        // Notify candidates with new/viewed status
        $affectedApplications = $job->applications()
            ->whereIn('status', ['new', 'viewed'])
            ->with('candidate.user')
            ->get();

        foreach ($affectedApplications as $application) {
            dispatch(new \App\Jobs\SendEmailJob($application, 'job_closed'));
        }

        ActivityLog::record($request->user()->id, 'close_job', "Closed job: {$job->title}");

        return response()->json(['message' => 'Đã đóng tin tuyển dụng.']);
    }

    public function publicShow(string $slug): JsonResponse
    {
        $job = Job::where('slug', $slug)
            ->where('status', 'published')
            ->with('department')
            ->firstOrFail();

        return response()->json($job);
    }
}
