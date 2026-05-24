<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $query = ActivityLog::with('user');

        if ($request->user_id) $query->where('user_id', $request->user_id);
        if ($request->action) $query->where('action', 'like', "%{$request->action}%");
        if ($request->from_date) $query->where('created_at', '>=', $request->from_date);
        if ($request->to_date) $query->where('created_at', '<=', $request->to_date);

        return response()->json($query->orderBy('created_at', 'desc')->paginate(30));
    }
}
