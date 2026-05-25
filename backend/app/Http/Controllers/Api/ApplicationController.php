<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Application;
use App\Models\ApplicationNote;
use App\Models\ApplicationStatusHistory;
use App\Models\Candidate;
use App\Models\Interview;
use App\Models\Job;
use App\Models\OnboardingTask;
use App\Events\NewApplicationEvent;
use App\Events\ApplicationStatusChangedEvent;
use App\Events\InterviewScheduledEvent;
use App\Jobs\SendEmailJob;
use App\Jobs\SendBulkEmailJob;
use App\Exports\ApplicationsExport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;

class ApplicationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Application::with(['job.department', 'candidate', 'assignedTo'])
            ->withCount('interviews');

        if ($user->isHM()) {
            $query->whereHas('job', fn($q) => $q->where('department_id', $user->department_id));
        }

        if ($request->job_id) $query->where('job_id', $request->job_id);
        if ($request->status) $query->where('status', $request->status);
        if ($request->assigned_to) $query->where('assigned_to', $request->assigned_to);

        if ($request->search) {
            $query->whereHas('candidate', fn($q) => $q->where('full_name', 'like', "%{$request->search}%")
                ->orWhere('email', 'like', "%{$request->search}%"));
        }

        if ($request->department_id) {
            $query->whereHas('job', fn($q) => $q->where('department_id', $request->department_id));
        }

        return response()->json($query->orderBy('created_at', 'desc')->paginate(20));
    }

    public function show(Request $request, $id)
    {
        $application = Application::with([
            'job.department',
            'candidate',
            'assignedTo',
            'statusHistory.changedBy',
            'interviews.interviewer',
            'interviews.evaluations.evaluator',
            'notes.user',
        ])->findOrFail($id);

        $user = $request->user();
        if ($user->isHM() && $application->job->department_id !== $user->department_id) {
            return response()->json(['message' => 'Không có quyền truy cập'], 403);
        }

        return response()->json($application);
    }

    public function apply(Request $request, $slug)
    {
        $job = Job::where('slug', $slug)->where('status', 'published')->firstOrFail();

        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'email' => 'required|email',
            'phone' => 'nullable|string|max:20',
            'cover_letter' => 'nullable|string',
            'cv' => 'required|file|mimes:pdf,doc,docx|max:5120',
        ]);

        $candidate = Candidate::firstOrCreate(
            ['email' => $validated['email']],
            ['full_name' => $validated['full_name'], 'phone' => $validated['phone'] ?? null]
        );

        if (Application::where('job_id', $job->id)->where('candidate_id', $candidate->id)->exists()) {
            return response()->json(['message' => 'Bạn đã nộp hồ sơ cho vị trí này rồi.'], 422);
        }

        $cvFile = $request->file('cv');
        $cvPath = $cvFile->store("cvs/{$job->id}", 'private');

        $application = Application::create([
            'job_id' => $job->id,
            'candidate_id' => $candidate->id,
            'cv_path' => $cvPath,
            'cv_original_name' => $cvFile->getClientOriginalName(),
            'cover_letter' => $validated['cover_letter'] ?? null,
            'status' => Application::STATUS_NEW,
        ]);

        ApplicationStatusHistory::create([
            'application_id' => $application->id,
            'from_status' => null,
            'to_status' => Application::STATUS_NEW,
            'changed_by' => 1,
            'note' => 'Application submitted by candidate',
        ]);

        try { broadcast(new NewApplicationEvent($application->load(['job', 'candidate'])))->toOthers(); } catch (\Exception) {}

        return response()->json([
            'message' => 'Hồ sơ đã được nộp thành công.',
            'application_id' => $application->id,
        ], 201);
    }

    public function changeStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|string',
            'note' => 'nullable|string',
            'rejection_reason' => 'nullable|string',
        ]);

        $application = Application::findOrFail($id);
        $user = $request->user();
        $newStatus = $request->status;

        if (!$application->canTransitionTo($newStatus, $user->role)) {
            return response()->json(['message' => 'Chuyển trạng thái không hợp lệ với quyền của bạn.'], 422);
        }

        $oldStatus = $application->status;

        $application->update([
            'status' => $newStatus,
            'rejection_reason' => $newStatus === Application::STATUS_REJECTED ? $request->rejection_reason : null,
        ]);

        ApplicationStatusHistory::create([
            'application_id' => $application->id,
            'from_status' => $oldStatus,
            'to_status' => $newStatus,
            'changed_by' => $user->id,
            'note' => $request->note,
        ]);

        if ($newStatus === Application::STATUS_HIRED) {
            $this->createDefaultOnboardingTasks($application->id);
        }

        // Tự động gửi email khi nhận hoặc từ chối
        if (in_array($newStatus, [Application::STATUS_HIRED, Application::STATUS_REJECTED])) {
            $templateCode = $newStatus === Application::STATUS_HIRED ? 'offer_letter' : 'rejection';
            dispatch(new SendEmailJob(
                $application->load(['candidate', 'job']),
                $templateCode,
                null
            ));
        }

        ActivityLog::log([
            'user_id' => $user->id,
            'action' => 'application.status_changed',
            'model_type' => 'Application',
            'model_id' => $application->id,
            'old_values' => ['status' => $oldStatus],
            'new_values' => ['status' => $newStatus],
            'ip_address' => $request->ip(),
        ]);

        try { broadcast(new ApplicationStatusChangedEvent($application->fresh()->load(['job', 'candidate'])))->toOthers(); } catch (\Exception) {}

        return response()->json($application->fresh()->load(['job', 'candidate', 'statusHistory.changedBy']));
    }

    private function createDefaultOnboardingTasks(int $applicationId): void
    {
        $tasks = [
            ['title' => 'Gửi thư mời nhận việc chính thức', 'category' => 'hr', 'sort_order' => 1],
            ['title' => 'Ký hợp đồng lao động', 'category' => 'hr', 'sort_order' => 2],
            ['title' => 'Chuẩn bị tài khoản email & hệ thống', 'category' => 'it', 'sort_order' => 3],
            ['title' => 'Bàn giao thiết bị làm việc (máy tính, thẻ nhân viên)', 'category' => 'it', 'sort_order' => 4],
            ['title' => 'Giới thiệu với đồng nghiệp và quản lý trực tiếp', 'category' => 'manager', 'sort_order' => 5],
            ['title' => 'Hướng dẫn nội quy, chính sách, văn hóa công ty', 'category' => 'hr', 'sort_order' => 6],
            ['title' => 'Phân công công việc và mục tiêu tháng đầu tiên', 'category' => 'manager', 'sort_order' => 7],
        ];

        foreach ($tasks as $task) {
            OnboardingTask::create(array_merge($task, ['application_id' => $applicationId]));
        }
    }

    public function bulkReject(Request $request)
    {
        $request->validate([
            'application_ids' => 'required|array',
            'application_ids.*' => 'exists:applications,id',
            'reason' => 'nullable|string',
        ]);

        $user = $request->user();

        DB::transaction(function () use ($request, $user) {
            foreach ($request->application_ids as $appId) {
                $application = Application::find($appId);
                if ($application && $application->status !== Application::STATUS_REJECTED) {
                    $old = $application->status;
                    $application->update([
                        'status' => Application::STATUS_REJECTED,
                        'rejection_reason' => $request->reason,
                    ]);
                    ApplicationStatusHistory::create([
                        'application_id' => $application->id,
                        'from_status' => $old,
                        'to_status' => Application::STATUS_REJECTED,
                        'changed_by' => $user->id,
                        'note' => 'Bulk rejected',
                    ]);
                }
            }
        });

        ActivityLog::log([
            'user_id' => $user->id,
            'action' => 'application.bulk_reject',
            'new_values' => ['count' => count($request->application_ids), 'reason' => $request->reason],
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['message' => 'Applications rejected successfully']);
    }

    public function bulkEmail(Request $request)
    {
        $request->validate([
            'application_ids' => 'required|array|min:1',
            'application_ids.*' => 'exists:applications,id',
            'template_code' => 'required|string',
            'custom_message' => 'nullable|string',
        ]);

        dispatch(new SendBulkEmailJob(
            $request->application_ids,
            $request->template_code,
            $request->custom_message
        ));

        return response()->json(['message' => 'Bulk email queued successfully']);
    }

    public function scheduleInterview(Request $request, $id)
    {
        $request->validate([
            'interviewer_id' => 'required|exists:users,id',
            'scheduled_at' => 'required|date|after:now',
            'duration_minutes' => 'integer|min:15',
            'type' => 'in:online,offline',
            'location' => 'nullable|string',
            'meeting_link' => 'nullable|url',
            'round' => 'integer|min:1',
            'notes' => 'nullable|string',
        ]);

        $application = Application::findOrFail($id);

        $newEnd = \Carbon\Carbon::parse($request->scheduled_at)
            ->addMinutes((int) ($request->duration_minutes ?? 60))
            ->toDateTimeString();

        $conflict = Interview::where('interviewer_id', $request->interviewer_id)
            ->whereIn('status', ['pending', 'confirmed'])
            ->where('scheduled_at', '<', $newEnd)
            ->whereRaw('DATE_ADD(scheduled_at, INTERVAL duration_minutes MINUTE) > ?', [$request->scheduled_at])
            ->exists();

        if ($conflict) {
            return response()->json(['message' => 'Interviewer đã có lịch phỏng vấn trùng giờ này.'], 422);
        }

        $token = Interview::generateToken();

        $interview = Interview::create([
            'application_id' => $application->id,
            'interviewer_id' => $request->interviewer_id,
            'scheduled_at' => $request->scheduled_at,
            'duration_minutes' => $request->duration_minutes ?? 60,
            'type' => $request->type ?? 'online',
            'location' => $request->location,
            'meeting_link' => $request->meeting_link,
            'status' => 'pending',
            'confirmation_token' => $token,
            'round' => $request->round ?? 1,
            'notes' => $request->notes,
        ]);

        if (in_array($application->status, [Application::STATUS_NEW, Application::STATUS_REVIEWING])) {
            $old = $application->status;
            $application->update(['status' => Application::STATUS_INTERVIEW_SCHEDULED]);
            ApplicationStatusHistory::create([
                'application_id' => $application->id,
                'from_status' => $old,
                'to_status' => Application::STATUS_INTERVIEW_SCHEDULED,
                'changed_by' => $request->user()->id,
                'note' => 'Interview scheduled',
            ]);
        }

        try { broadcast(new InterviewScheduledEvent($interview->load(['application.candidate', 'interviewer'])))->toOthers(); } catch (\Exception) {}

        // Tự động gửi email mời phỏng vấn kèm chi tiết lịch + link xác nhận
        dispatch(new SendEmailJob(
            $application->load(['candidate', 'job']),
            'interview_invitation',
            null,
            $interview
        ));

        return response()->json($interview->load(['interviewer', 'application.candidate']), 201);
    }

    public function sendEmail(Request $request, $id)
    {
        $request->validate([
            'template_code' => 'required|string',
            'custom_message' => 'nullable|string',
        ]);

        $application = Application::with(['candidate', 'job'])->findOrFail($id);

        dispatch(new SendEmailJob(
            $application,
            $request->template_code,
            $request->custom_message
        ));

        ActivityLog::log([
            'user_id' => $request->user()->id,
            'action' => 'application.send_email',
            'model_type' => 'Application',
            'model_id' => $application->id,
            'new_values' => ['template_code' => $request->template_code],
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['message' => 'Email queued successfully']);
    }

    public function export(Request $request)
    {
        return Excel::download(new ApplicationsExport($request->all()), 'applications.xlsx');
    }

    public function addNote(Request $request, $id)
    {
        $request->validate([
            'content' => 'required|string',
            'is_private' => 'boolean',
        ]);

        $application = Application::findOrFail($id);

        $note = ApplicationNote::create([
            'application_id' => $application->id,
            'user_id' => $request->user()->id,
            'content' => $request->content,
            'is_private' => $request->is_private ?? false,
        ]);

        return response()->json($note->load('user'), 201);
    }

    public function downloadCv(Request $request, $id)
    {
        $application = Application::with('job')->findOrFail($id);

        $user = $request->user();
        if ($user->isHM() && $application->job->department_id !== $user->department_id) {
            return response()->json(['message' => 'Không có quyền truy cập'], 403);
        }

        if (!Storage::disk('private')->exists($application->cv_path)) {
            return response()->json(['message' => 'Không tìm thấy file CV'], 404);
        }

        return Storage::disk('private')->download($application->cv_path, $application->cv_original_name);
    }

    public function getNotes(Request $request, $id)
    {
        $application = Application::findOrFail($id);
        $user = $request->user();

        $notes = ApplicationNote::with('user')
            ->where('application_id', $application->id)
            ->when(!$user->isSuperAdmin(), fn($q) => $q->where(
                fn($q2) => $q2->where('is_private', false)->orWhere('user_id', $user->id)
            ))
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($notes);
    }
}
