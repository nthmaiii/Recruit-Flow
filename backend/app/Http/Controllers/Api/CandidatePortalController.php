<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Candidate;
use Illuminate\Http\Request;

class CandidatePortalController extends Controller
{
    public function myApplications(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $candidate = Candidate::where('email', $request->email)->first();

        if (!$candidate) {
            return response()->json([]);
        }

        $applications = Application::with(['job.department', 'interviews'])
            ->where('candidate_id', $candidate->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($applications);
    }
}
