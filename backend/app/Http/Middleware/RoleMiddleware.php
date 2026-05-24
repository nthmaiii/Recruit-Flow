<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string ...$roles): mixed
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, $roles)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if (!$user->is_active) {
            return response()->json(['message' => 'Account is disabled'], 403);
        }

        return $next($request);
    }
}
