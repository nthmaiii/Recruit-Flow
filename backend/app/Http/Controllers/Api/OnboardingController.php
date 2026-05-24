<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OnboardingTask;
use App\Models\Application;
use Illuminate\Http\Request;

class OnboardingController extends Controller
{
    public function index($applicationId)
    {
        $application = Application::findOrFail($applicationId);

        $tasks = OnboardingTask::with(['completedBy', 'assignedTo'])
            ->where('application_id', $application->id)
            ->orderBy('sort_order')
            ->get();

        return response()->json($tasks);
    }

    public function store(Request $request, $applicationId)
    {
        $application = Application::findOrFail($applicationId);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'in:hr,it,manager,admin',
            'assigned_to' => 'nullable|exists:users,id',
            'due_date' => 'nullable|date',
        ]);

        $maxOrder = OnboardingTask::where('application_id', $application->id)->max('sort_order') ?? 0;

        $task = OnboardingTask::create(array_merge($validated, [
            'application_id' => $application->id,
            'sort_order' => $maxOrder + 1,
        ]));

        return response()->json($task->load(['completedBy', 'assignedTo']), 201);
    }

    public function complete(Request $request, $applicationId, $taskId)
    {
        $task = OnboardingTask::where('application_id', $applicationId)->findOrFail($taskId);

        $task->update([
            'is_completed' => !$task->is_completed,
            'completed_at' => !$task->is_completed ? now() : null,
            'completed_by' => !$task->is_completed ? $request->user()->id : null,
        ]);

        return response()->json($task->fresh()->load(['completedBy', 'assignedTo']));
    }

    public function destroy($applicationId, $taskId)
    {
        $task = OnboardingTask::where('application_id', $applicationId)->findOrFail($taskId);
        $task->delete();

        return response()->json(['message' => 'Đã xóa task']);
    }
}
