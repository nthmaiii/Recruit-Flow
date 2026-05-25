<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::with('department');

        if ($request->role) $query->where('role', $request->role);
        if ($request->department_id) $query->where('department_id', $request->department_id);
        if ($request->search) {
            $query->where(fn($q) => $q->where('name', 'like', "%{$request->search}%")
                ->orWhere('email', 'like', "%{$request->search}%"));
        }

        return response()->json($query->orderBy('name')->paginate(20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'role' => 'required|in:super_admin,hr,hiring_manager',
            'department_id' => 'nullable|exists:departments,id',
            'phone' => 'nullable|string',
        ]);

        $tempPassword = Str::random(10);

        $user = User::create(array_merge($validated, [
            'password' => Hash::make($tempPassword),
            'must_change_password' => true,
        ]));

        ActivityLog::log([
            'user_id' => $request->user()->id,
            'action' => 'user.create',
            'model_type' => 'User',
            'model_id' => $user->id,
            'new_values' => ['email' => $user->email, 'role' => $user->role],
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'user' => $user->load('department'),
            'temp_password' => $tempPassword,
        ], 201);
    }

    public function show($id)
    {
        return response()->json(User::with('department')->findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $id,
            'role' => 'sometimes|in:super_admin,hr,hiring_manager',
            'department_id' => 'nullable|exists:departments,id',
            'phone' => 'nullable|string',
            'is_active' => 'sometimes|boolean',
        ]);

        $user->update($validated);

        ActivityLog::log([
            'user_id' => $request->user()->id,
            'action' => 'user.update',
            'model_type' => 'User',
            'model_id' => $user->id,
            'new_values' => $validated,
            'ip_address' => $request->ip(),
        ]);

        return response()->json($user->fresh()->load('department'));
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);

        if ($user->id === request()->user()->id) {
            return response()->json(['message' => 'Cannot delete your own account'], 422);
        }

        ActivityLog::log([
            'user_id' => request()->user()->id,
            'action' => 'user.delete',
            'model_type' => 'User',
            'model_id' => $user->id,
            'old_values' => ['email' => $user->email, 'role' => $user->role],
            'ip_address' => request()->ip(),
        ]);

        $user->delete();

        return response()->json(['message' => 'User deleted']);
    }

    public function resetPassword($id)
    {
        $user = User::findOrFail($id);
        $tempPassword = Str::random(10);

        $user->update([
            'password' => Hash::make($tempPassword),
            'must_change_password' => true,
        ]);

        ActivityLog::log([
            'user_id' => request()->user()->id,
            'action' => 'user.reset_password',
            'model_type' => 'User',
            'model_id' => $user->id,
            'ip_address' => request()->ip(),
        ]);

        return response()->json(['temp_password' => $tempPassword]);
    }
}
