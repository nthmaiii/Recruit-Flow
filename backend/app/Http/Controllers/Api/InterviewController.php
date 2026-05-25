<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Events\InterviewConfirmedEvent;
use App\Models\ActivityLog;
use App\Models\AppNotification;
use App\Models\Interview;
use App\Models\InterviewEvaluation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InterviewController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Interview::with(['application.candidate', 'application.job', 'interviewer', 'evaluations']);

        if ($user->isHM()) {
            $query->where('interviewer_id', $user->id);
        }

        if ($request->application_id) {
            $query->where('application_id', $request->application_id);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->from_date) {
            $query->where('scheduled_at', '>=', $request->from_date);
        }

        if ($request->to_date) {
            $query->where('scheduled_at', '<=', $request->to_date);
        }

        return response()->json($query->orderBy('scheduled_at', 'desc')->paginate(20));
    }

    public function store(Request $request)
    {
        $request->validate([
            'application_id' => 'required|exists:applications,id',
            'interviewer_id' => 'required|exists:users,id',
            'scheduled_at' => 'required|date|after:now',
            'duration_minutes' => 'integer|min:15',
            'type' => 'in:online,offline',
            'location' => 'nullable|string',
            'meeting_link' => 'nullable|url',
            'round' => 'integer|min:1',
            'notes' => 'nullable|string',
        ]);

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

        $interview = Interview::create(array_merge($request->validated(), [
            'status' => 'pending',
            'confirmation_token' => $token,
        ]));

        ActivityLog::log([
            'user_id' => $request->user()->id,
            'action' => 'interview.schedule',
            'model_type' => 'Interview',
            'model_id' => $interview->id,
            'new_values' => [
                'application_id' => $interview->application_id,
                'scheduled_at' => $interview->scheduled_at,
                'type' => $interview->type,
            ],
            'ip_address' => $request->ip(),
        ]);

        return response()->json($interview->load(['interviewer', 'application.candidate']), 201);
    }

    public function show($id)
    {
        $interview = Interview::with(['application.candidate', 'application.job', 'interviewer', 'evaluations.evaluator'])
            ->findOrFail($id);

        return response()->json($interview);
    }

    public function update(Request $request, $id)
    {
        $interview = Interview::findOrFail($id);

        $validated = $request->validate([
            'scheduled_at' => 'sometimes|date',
            'duration_minutes' => 'sometimes|integer|min:15',
            'type' => 'sometimes|in:online,offline',
            'location' => 'nullable|string',
            'meeting_link' => 'nullable|url',
            'status' => 'sometimes|in:pending,confirmed,completed,cancelled',
            'notes' => 'nullable|string',
        ]);

        if (isset($validated['scheduled_at'])) {
            $newStart = $validated['scheduled_at'];
            $newEnd = \Carbon\Carbon::parse($newStart)
                ->addMinutes((int) ($validated['duration_minutes'] ?? $interview->duration_minutes))
                ->toDateTimeString();

            $conflict = Interview::where('interviewer_id', $interview->interviewer_id)
                ->where('id', '!=', $interview->id)
                ->whereIn('status', ['pending', 'confirmed'])
                ->where('scheduled_at', '<', $newEnd)
                ->whereRaw('DATE_ADD(scheduled_at, INTERVAL duration_minutes MINUTE) > ?', [$newStart])
                ->exists();

            if ($conflict) {
                return response()->json(['message' => 'Interviewer đã có lịch phỏng vấn trùng giờ này.'], 422);
            }
        }

        $interview->update($validated);

        ActivityLog::log([
            'user_id' => $request->user()->id,
            'action' => 'interview.update',
            'model_type' => 'Interview',
            'model_id' => $interview->id,
            'new_values' => $validated,
            'ip_address' => $request->ip(),
        ]);

        return response()->json($interview->fresh()->load(['interviewer', 'application.candidate']));
    }

    public function evaluate(Request $request, $id)
    {
        $request->validate([
            'technical_score' => 'nullable|numeric|min:0|max:10',
            'communication_score' => 'nullable|numeric|min:0|max:10',
            'attitude_score' => 'nullable|numeric|min:0|max:10',
            'overall_score' => 'nullable|numeric|min:0|max:10',
            'strengths' => 'nullable|string',
            'weaknesses' => 'nullable|string',
            'recommendation' => 'nullable|string',
            'result' => 'required|in:pass,fail,consider',
        ]);

        $interview = Interview::findOrFail($id);

        $evaluation = InterviewEvaluation::updateOrCreate(
            ['interview_id' => $interview->id, 'evaluator_id' => $request->user()->id],
            $request->validated()
        );

        $interview->update(['status' => 'completed']);
        $interview->application->recalculateRating();

        ActivityLog::log([
            'user_id' => $request->user()->id,
            'action' => 'interview.evaluate',
            'model_type' => 'Interview',
            'model_id' => $interview->id,
            'new_values' => ['result' => $request->result, 'overall_score' => $request->overall_score],
            'ip_address' => $request->ip(),
        ]);

        return response()->json($evaluation->load('evaluator'));
    }

    public function confirmByToken(Request $request, string $token)
    {
        $interview = Interview::where('confirmation_token', $token)
            ->where('status', 'pending')
            ->with(['application.candidate', 'application.job', 'interviewer'])
            ->firstOrFail();

        if ($request->isMethod('get')) {
            return response()->json([
                'interview' => $interview,
            ]);
        }

        $request->validate([
            'action' => 'required|in:confirm,decline',
        ]);

        $application = $interview->application;
        $candidateName = $application->candidate->full_name;
        $jobTitle = $application->job->title;

        if ($request->action === 'confirm') {
            $interview->update(['status' => 'confirmed', 'confirmed_at' => now()]);

            $title   = 'Ứng viên đã xác nhận lịch phỏng vấn';
            $message = "{$candidateName} đã xác nhận tham dự phỏng vấn vị trí {$jobTitle}.";
        } else {
            $interview->update(['status' => 'cancelled']);

            $title   = 'Ứng viên từ chối lịch phỏng vấn';
            $message = "{$candidateName} đã từ chối lịch phỏng vấn vị trí {$jobTitle}. Cần lên lịch lại.";
        }

        // Lưu DB notification cho người phụ trách hồ sơ
        $notifyUserId = $application->assigned_to ?? $application->job->created_by ?? null;
        if ($notifyUserId) {
            AppNotification::create([
                'user_id' => $notifyUserId,
                'type'    => 'interview_' . $request->action,
                'title'   => $title,
                'message' => $message,
                'data'    => [
                    'interview_id'   => $interview->id,
                    'application_id' => $application->id,
                ],
                'is_read'    => false,
                'created_at' => now(),
            ]);
        }

        // Broadcast real-time cho HR
        try {
            broadcast(new InterviewConfirmedEvent($interview, $request->action))->toOthers();
        } catch (\Exception) {}

        $responseMsg = $request->action === 'confirm'
            ? 'Đã xác nhận tham dự phỏng vấn. Hẹn gặp bạn!'
            : 'Đã từ chối lịch phỏng vấn. Chúng tôi sẽ liên hệ lại để sắp xếp thời gian phù hợp.';

        return response()->json(['message' => $responseMsg]);
    }
}
