<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $users = User::with('department')
            ->whereIn('role', ['SA', 'HR', 'HM'])
            ->when($request->search, fn($q) => $q->where('name', 'like', '%' . $request->search . '%'))
            ->when($request->role, fn($q) => $q->where('role', $request->role))
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json($users);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'role' => 'required|in:HR,HM,SA',
            'department_id' => 'required_if:role,HM|nullable|exists:departments,id',
            'phone' => 'nullable|string|max:20',
        ]);

        $tempPassword = Str::random(10);
        $validated['password'] = Hash::make($tempPassword);
        $validated['must_change_password'] = true;

        $user = User::create($validated);

        // Send welcome email with temp password
        \Mail::to($user->email)->send(new \App\Mail\WelcomeMail($user, $tempPassword));

        ActivityLog::record($request->user()->id, 'create_user', "Created user: {$user->email}");

        return response()->json($user->load('department'), 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'role' => 'sometimes|in:HR,HM,SA',
            'department_id' => 'nullable|exists:departments,id',
            'phone' => 'nullable|string|max:20',
            'is_active' => 'sometimes|boolean',
        ]);

        $user->update($validated);

        ActivityLog::record($request->user()->id, 'update_user', "Updated user: {$user->email}");

        return response()->json($user->fresh('department'));
    }

    public function resetPassword(Request $request, User $user): JsonResponse
    {
        $tempPassword = Str::random(10);
        $user->update([
            'password' => Hash::make($tempPassword),
            'must_change_password' => true,
        ]);

        \Mail::to($user->email)->send(new \App\Mail\PasswordResetMail($user, $tempPassword));

        ActivityLog::record($request->user()->id, 'reset_password', "Reset password for: {$user->email}");

        return response()->json(['message' => 'Mật khẩu mới đã được gửi qua email.']);
    }

    public function toggleActive(Request $request, User $user): JsonResponse
    {
        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'Không thể khóa chính mình.'], 422);
        }

        $user->update(['is_active' => !$user->is_active]);

        $action = $user->is_active ? 'activate' : 'deactivate';
        ActivityLog::record($request->user()->id, $action . '_user', "{$action} user: {$user->email}");

        return response()->json($user);
    }

    public function activityLogs(Request $request): JsonResponse
    {
        $logs = \App\Models\ActivityLog::with('user')
            ->orderBy('created_at', 'desc')
            ->paginate(30);

        return response()->json($logs);
    }
}
