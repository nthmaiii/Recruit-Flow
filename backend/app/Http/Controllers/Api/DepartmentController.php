<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    public function index()
    {
        return response()->json(Department::with('manager')->withCount(['users', 'jobs'])->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:departments',
            'description' => 'nullable|string',
            'manager_id' => 'nullable|exists:users,id',
        ]);

        $department = Department::create($validated);

        return response()->json($department->load('manager'), 201);
    }

    public function show($id)
    {
        return response()->json(Department::with(['manager', 'users'])->findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $department = Department::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255|unique:departments,name,' . $id,
            'description' => 'nullable|string',
            'manager_id' => 'nullable|exists:users,id',
        ]);

        $department->update($validated);

        return response()->json($department->fresh()->load('manager'));
    }

    public function destroy($id)
    {
        $department = Department::findOrFail($id);

        if ($department->users()->exists()) {
            return response()->json(['message' => 'Cannot delete department with existing users'], 422);
        }

        $department->delete();

        return response()->json(['message' => 'Department deleted']);
    }
}
