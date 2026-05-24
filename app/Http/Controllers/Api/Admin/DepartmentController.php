<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    public function index(): JsonResponse
    {
        $departments = Department::with('manager')->withCount('users', 'jobs')->get();
        return response()->json($departments);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:departments',
            'description' => 'nullable|string',
            'manager_id' => 'nullable|exists:users,id',
        ]);

        $department = Department::create($validated);

        if ($validated['manager_id'] ?? null) {
            User::where('id', $validated['manager_id'])->update(['department_id' => $department->id]);
        }

        return response()->json($department->load('manager'), 201);
    }

    public function update(Request $request, Department $department): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:100|unique:departments,name,' . $department->id,
            'description' => 'nullable|string',
            'manager_id' => 'nullable|exists:users,id',
        ]);

        $department->update($validated);

        return response()->json($department->fresh('manager'));
    }

    public function destroy(Department $department): JsonResponse
    {
        if ($department->users()->exists() || $department->jobs()->exists()) {
            return response()->json([
                'message' => 'Không thể xóa bộ phận đang có nhân sự hoặc tin tuyển dụng.',
            ], 422);
        }

        $department->delete();
        return response()->json(['message' => 'Đã xóa bộ phận.']);
    }
}
