<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmailTemplate;
use Illuminate\Http\Request;

class EmailTemplateController extends Controller
{
    public function index()
    {
        return response()->json(EmailTemplate::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|unique:email_templates',
            'subject' => 'required|string',
            'body' => 'required|string',
            'variables' => 'nullable|array',
        ]);

        $template = EmailTemplate::create($validated);

        return response()->json($template, 201);
    }

    public function show($id)
    {
        return response()->json(EmailTemplate::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $template = EmailTemplate::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'subject' => 'sometimes|string',
            'body' => 'sometimes|string',
            'variables' => 'nullable|array',
            'is_active' => 'sometimes|boolean',
        ]);

        $template->update($validated);

        return response()->json($template->fresh());
    }

    public function destroy($id)
    {
        EmailTemplate::findOrFail($id)->delete();
        return response()->json(['message' => 'Template deleted']);
    }
}
