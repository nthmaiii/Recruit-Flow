<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Job;
use Illuminate\Http\Request;

class JobController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Job::with(['department', 'creator'])
            ->withCount('applications');

        if ($user->isHM()) {
            $query->where('department_id', $user->department_id);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->department_id) {
            $query->where('department_id', $request->department_id);
        }

        if ($request->search) {
            $query->where('title', 'like', "%{$request->search}%");
        }

        return response()->json($query->orderBy('created_at', 'desc')->paginate(15));
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            // HM's department is auto-assigned, so not required from form
            'department_id' => $user->isHM() ? 'nullable|exists:departments,id' : 'required|exists:departments,id',
            'description' => 'required|string',
            'requirements' => 'required|string',
            'benefits' => 'nullable|string',
            'location' => 'required|string',
            'type' => 'required|in:full_time,part_time,contract,internship',
            'level' => 'required|in:intern,junior,mid,senior,lead,manager',
            'salary_min' => 'nullable|numeric|min:0',
            'salary_max' => 'nullable|numeric|gte:salary_min',
            'status' => 'in:draft,published',
            'deadline' => 'nullable|date|after:today',
            'vacancies' => 'integer|min:1',
        ]);

        $validated['created_by'] = $user->id;
        $validated['slug'] = Job::generateSlug($validated['title']);

        // HM: force their own department and send to approval
        if ($user->isHM()) {
            $validated['department_id'] = $user->department_id;
            $validated['status'] = Job::STATUS_PENDING_APPROVAL;
        }

        $job = Job::create($validated);

        return response()->json($job->load(['department', 'creator']), 201);
    }

    public function show(Request $request, $id)
    {
        $job = Job::with(['department', 'creator'])->withCount('applications')->findOrFail($id);

        if ($request->user()->isHM() && $job->department_id !== $request->user()->department_id) {
            return response()->json(['message' => 'Không có quyền truy cập'], 403);
        }

        return response()->json($job);
    }

    public function update(Request $request, $id)
    {
        $job = Job::findOrFail($id);
        $hasApplications = $job->hasApplications();

        $rules = [
            'description' => 'sometimes|string',
            'requirements' => 'sometimes|string',
            'benefits' => 'nullable|string',
            'status' => 'sometimes|in:draft,published,closed',
            'deadline' => 'nullable|date',
            'vacancies' => 'sometimes|integer|min:1',
        ];

        if (!$hasApplications) {
            $rules = array_merge($rules, [
                'title' => 'sometimes|string|max:255',
                'department_id' => 'sometimes|exists:departments,id',
                'location' => 'sometimes|string',
                'type' => 'sometimes|in:full_time,part_time,contract,internship',
                'level' => 'sometimes|in:intern,junior,mid,senior,lead,manager',
                'salary_min' => 'nullable|numeric|min:0',
                'salary_max' => 'nullable|numeric',
            ]);
        }

        $validated = $request->validate($rules);

        if (isset($validated['title'])) {
            $validated['slug'] = Job::generateSlug($validated['title']);
        }

        // If HM re-submits a rejected/draft job, put back to pending_approval
        if ($request->user()->isHM() && in_array($job->status, [Job::STATUS_DRAFT])) {
            $validated['status'] = Job::STATUS_PENDING_APPROVAL;
        }

        $job->update($validated);

        return response()->json($job->fresh()->load(['department', 'creator']));
    }

    public function destroy($id)
    {
        $job = Job::findOrFail($id);

        if ($job->hasApplications()) {
            return response()->json(['message' => 'Không thể xóa tin đã có hồ sơ ứng tuyển'], 422);
        }

        $job->delete();

        return response()->json(['message' => 'Đã xóa tin tuyển dụng']);
    }

    public function approve(Request $request, $id)
    {
        $job = Job::findOrFail($id);

        if ($job->status !== Job::STATUS_PENDING_APPROVAL) {
            return response()->json(['message' => 'Tin tuyển dụng không ở trạng thái chờ duyệt'], 422);
        }

        $job->update([
            'status' => Job::STATUS_PUBLISHED,
            'approved_by' => $request->user()->id,
            'approval_note' => null,
        ]);

        return response()->json($job->fresh()->load(['department', 'creator']));
    }

    public function rejectApproval(Request $request, $id)
    {
        $request->validate(['note' => 'nullable|string']);

        $job = Job::findOrFail($id);

        if ($job->status !== Job::STATUS_PENDING_APPROVAL) {
            return response()->json(['message' => 'Tin tuyển dụng không ở trạng thái chờ duyệt'], 422);
        }

        $job->update([
            'status' => Job::STATUS_DRAFT,
            'approval_note' => $request->note,
        ]);

        return response()->json($job->fresh()->load(['department', 'creator']));
    }

    public function copy($id)
    {
        $job = Job::findOrFail($id);

        $newJob = $job->replicate();
        $newJob->title = $job->title . ' (Copy)';
        $newJob->slug = Job::generateSlug($newJob->title);
        $newJob->status = Job::STATUS_DRAFT;
        $newJob->created_by = request()->user()->id;
        $newJob->approved_by = null;
        $newJob->approval_note = null;
        $newJob->save();

        return response()->json($newJob->load(['department', 'creator']), 201);
    }

    public function close($id)
    {
        $job = Job::findOrFail($id);
        $job->update(['status' => Job::STATUS_CLOSED]);

        return response()->json($job->fresh());
    }

    public function publicList(Request $request)
    {
        $query = Job::with('department')
            ->where('status', Job::STATUS_PUBLISHED)
            ->where(function ($q) {
                $q->whereNull('deadline')->orWhere('deadline', '>=', now());
            });

        if ($request->department_id) $query->where('department_id', $request->department_id);
        if ($request->type) $query->where('type', $request->type);
        if ($request->search) $query->where('title', 'like', "%{$request->search}%");

        return response()->json($query->orderBy('created_at', 'desc')->paginate(12));
    }

    public function publicDetail($slug)
    {
        $job = Job::with('department')
            ->where('slug', $slug)
            ->where('status', Job::STATUS_PUBLISHED)
            ->firstOrFail();

        return response()->json($job);
    }
}
