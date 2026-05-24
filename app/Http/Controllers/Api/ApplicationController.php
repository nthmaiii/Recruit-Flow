<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\SendBulkEmailJob;
use App\Jobs\SendEmailJob;
use App\Models\ActivityLog;
use App\Models\Application;
use App\Models\AppNotification;
use App\Models\Candidate;
use App\Models\Job;
use App\Models\User;
use App\Services\ApplicationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Facades\Excel;

class ApplicationController extends Controller
{
    public function __construct(private ApplicationService $service) {}

    public function index(Request $request, Job $job): JsonResponse
    {
        $user = $request->user();

        if ($user->role === 'HM' && $job->department_id !== $user->department_id) {
            return response()->json(['message' => 'Access denied'], 403);
        }

        $query = Application::with(['candidate.user'])
            ->where('job_id', $job->id);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('rating_min')) {
            $query->where('rating_avg', '>=', $request->rating_min);
        }
        if ($request->filled('tags')) {
            foreach ((array) $request->tags as $tag) {
                $query->whereJsonContains('tags', $tag);
            }
        }
        if ($request->filled('search')) {
            $query->whereHas('candidate', function ($q) use ($request) {
                $q->where('full_name', 'like', '%' . $request->search . '%')
                  ->orWhereHas('user', fn($q2) => $q2->where('email', 'like', '%' . $request->search . '%'));
            });
        }

        $applications = $query->orderBy('applied_at', 'desc')->paginate(20);

        return response()->json($applications);
    }

    public function show(Request $request, Application $application): JsonResponse
    {
        $user = $request->user();

        if ($user->role === 'HM' && $application->job->department_id !== $user->department_id) {
            return response()->json(['message' => 'Access denied'], 403);
        }

        $application->load([
            'job.department',
            'candidate.user',
            'statusHistory.changedBy',
            'interviews.interviewer',
            'interviews.evaluation.evaluator',
        ]);

        return response()->json($application);
    }

    public function updateStatus(Request $request, Application $application): JsonResponse
    {
        $user = $request->user();
        $newStatus = $request->input('status');
        $role = in_array($user->role, ['SA', 'HR']) ? 'HR' : 'HM';

        if (!$application->canTransitionTo($newStatus, $role)) {
            return response()->json([
                'message' => "Không thể chuyển từ '{$application->status}' sang '{$newStatus}'.",
            ], 422);
        }

        $validated = $request->validate([
            'status' => 'required|string',
            'note' => 'required|string|min:10',
            'rejection_reason' => $newStatus === 'rejected' ? 'required|string' : 'nullable|string',
        ]);

        $this->service->changeStatus($application, $validated, $user);

        ActivityLog::record($user->id, 'change_application_status',
            "Application #{$application->id} {$application->status} → {$newStatus}");

        return response()->json($application->fresh(['candidate.user', 'statusHistory.changedBy']));
    }

    public function submit(Request $request, string $slug): JsonResponse
    {
        $job = Job::where('slug', $slug)->where('status', 'published')->firstOrFail();

        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'email' => 'required|email',
            'phone' => ['required', 'regex:/^(84|0[3|5|7|8|9])+([0-9]{8})$/'],
            'cv_file' => 'required|file|mimes:pdf,doc,docx|max:5120',
            'cover_letter' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($request, $job, $validated) {
            // Find or create user/candidate
            $user = User::firstOrCreate(
                ['email' => $validated['email']],
                [
                    'name' => $validated['full_name'],
                    'password' => bcrypt($tempPassword = Str::random(8)),
                    'role' => 'CANDIDATE',
                    'must_change_password' => true,
                ]
            );

            $isNewUser = $user->wasRecentlyCreated;
            if ($isNewUser) {
                $candidate = Candidate::create([
                    'user_id' => $user->id,
                    'full_name' => $validated['full_name'],
                    'phone' => $validated['phone'],
                ]);
            } else {
                $candidate = $user->candidate;
                if (!$candidate) {
                    return response()->json(['message' => 'Email này không thuộc ứng viên.'], 422);
                }
            }

            // Check duplicate application
            $exists = Application::where('job_id', $job->id)
                ->where('candidate_id', $candidate->id)
                ->exists();

            if ($exists) {
                return response()->json(['message' => 'Bạn đã nộp hồ sơ cho vị trí này.'], 422);
            }

            // Store CV
            $file = $request->file('cv_file');
            $sanitizedName = Str::slug($validated['full_name']);
            $filename = time() . '_' . $sanitizedName . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs("cvs/{$job->id}", $filename, 'local');

            $application = Application::create([
                'job_id' => $job->id,
                'candidate_id' => $candidate->id,
                'cv_path' => $path,
                'cover_letter' => $validated['cover_letter'] ?? null,
                'status' => 'new',
            ]);

            // Send welcome email + CV received
            dispatch(new SendEmailJob($application, 'cv_received', $isNewUser ? $tempPassword ?? null : null));

            // Notify HR
            $hrUsers = User::whereIn('role', ['SA', 'HR'])->get();
            foreach ($hrUsers as $hr) {
                AppNotification::create([
                    'user_id' => $hr->id,
                    'type' => 'new_application',
                    'data' => [
                        'application_id' => $application->id,
                        'candidate_name' => $validated['full_name'],
                        'job_title' => $job->title,
                    ],
                ]);
            }

            event(new \App\Events\NewApplicationSubmitted($application));

            return response()->json([
                'message' => 'Nộp hồ sơ thành công. Vui lòng kiểm tra email.',
                'application_id' => $application->id,
            ], 201);
        });
    }

    public function sendEmail(Request $request, Application $application): JsonResponse
    {
        $request->validate([
            'template_type' => 'required|in:cv_received,interview_invitation,rejection,offer_letter',
        ]);

        dispatch(new SendEmailJob($application, $request->template_type));

        ActivityLog::record($request->user()->id, 'send_email',
            "Sent {$request->template_type} to application #{$application->id}");

        return response()->json(['message' => 'Email đã được gửi vào hàng đợi.']);
    }

    public function bulkReject(Request $request): JsonResponse
    {
        $request->validate([
            'application_ids' => 'required|array',
            'application_ids.*' => 'exists:applications,id',
            'rejection_reason' => 'required|string',
            'note' => 'required|string|min:10',
        ]);

        $applications = Application::whereIn('id', $request->application_ids)
            ->whereNotIn('status', ['hired', 'rejected'])
            ->get();

        foreach ($applications as $application) {
            $this->service->changeStatus($application, [
                'status' => 'rejected',
                'note' => $request->note,
                'rejection_reason' => $request->rejection_reason,
            ], $request->user());
        }

        dispatch(new SendBulkEmailJob($applications->pluck('id')->toArray(), 'rejection'));

        ActivityLog::record($request->user()->id, 'bulk_reject',
            'Bulk rejected ' . $applications->count() . ' applications');

        return response()->json(['message' => "Đã từ chối {$applications->count()} hồ sơ."]);
    }

    public function export(Request $request, Job $job)
    {
        return Excel::download(
            new \App\Exports\ApplicationsExport($job->id, $request->all()),
            "applications-job-{$job->id}.xlsx"
        );
    }

    public function updateTags(Request $request, Application $application): JsonResponse
    {
        $request->validate([
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
        ]);

        $application->update(['tags' => $request->tags]);

        return response()->json($application);
    }

    // Candidate portal: list own applications
    public function myApplications(Request $request): JsonResponse
    {
        $candidate = $request->user()->candidate;
        if (!$candidate) {
            return response()->json(['data' => []]);
        }

        $applications = Application::with(['job.department', 'interviews.interviewer'])
            ->where('candidate_id', $candidate->id)
            ->orderBy('applied_at', 'desc')
            ->get();

        return response()->json($applications);
    }
}
