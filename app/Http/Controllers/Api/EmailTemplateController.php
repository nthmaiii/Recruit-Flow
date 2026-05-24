<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmailTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmailTemplateController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(EmailTemplate::all());
    }

    public function show(EmailTemplate $emailTemplate): JsonResponse
    {
        return response()->json($emailTemplate);
    }

    public function update(Request $request, EmailTemplate $emailTemplate): JsonResponse
    {
        $validated = $request->validate([
            'subject' => 'required|string|max:255',
            'body_html' => 'required|string',
        ]);

        $validated['updated_by'] = $request->user()->id;

        $emailTemplate->update($validated);

        return response()->json($emailTemplate);
    }
}
