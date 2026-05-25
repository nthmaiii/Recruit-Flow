<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\JobController;
use App\Http\Controllers\Api\ApplicationController;
use App\Http\Controllers\Api\InterviewController;
use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\EmailTemplateController;
use App\Http\Controllers\Api\CandidatePortalController;
use App\Http\Controllers\Api\ActivityLogController;
use App\Http\Controllers\Api\OnboardingController;

Route::prefix('v1')->group(function () {

    // Auth
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);

    // Public job routes
    Route::get('/jobs/public', [JobController::class, 'publicList']);
    Route::get('/jobs/{slug}/apply', [JobController::class, 'publicDetail']);
    Route::post('/jobs/{slug}/apply', [ApplicationController::class, 'apply']);

    // Candidate portal (no auth required - uses token or email lookup)
    Route::get('/candidate/applications', [CandidatePortalController::class, 'myApplications']);

    // Interview confirmation (public, token-based)
    Route::get('/confirm-interview/{token}', [InterviewController::class, 'confirmByToken']);
    Route::post('/confirm-interview/{token}', [InterviewController::class, 'confirmByToken']);

    // Authenticated routes
    Route::middleware('auth:sanctum')->group(function () {

        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::put('/me', [AuthController::class, 'updateProfile']);
        Route::post('/change-password', [AuthController::class, 'changePassword']);

        // Notifications
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::post('/notifications/{id}/read', [NotificationController::class, 'markRead']);
        Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);

        // HR + HM + SA routes
        Route::middleware('role:super_admin,hr,hiring_manager')->group(function () {

            // Jobs
            Route::apiResource('jobs', JobController::class);
            Route::post('/jobs/{id}/copy', [JobController::class, 'copy']);
            Route::post('/jobs/{id}/close', [JobController::class, 'close']);
            Route::post('/jobs/{id}/approve', [JobController::class, 'approve']);
            Route::post('/jobs/{id}/reject-approval', [JobController::class, 'rejectApproval']);

            // Applications
            Route::get('/applications', [ApplicationController::class, 'index']);
            Route::get('/applications/export', [ApplicationController::class, 'export']);
            Route::post('/applications/bulk-reject', [ApplicationController::class, 'bulkReject']);
            Route::post('/applications/bulk-email', [ApplicationController::class, 'bulkEmail']);
            Route::get('/applications/{id}', [ApplicationController::class, 'show']);
            Route::post('/applications/{id}/status', [ApplicationController::class, 'changeStatus']);
            Route::post('/applications/{id}/schedule-interview', [ApplicationController::class, 'scheduleInterview']);
            Route::post('/applications/{id}/send-email', [ApplicationController::class, 'sendEmail']);
            Route::post('/applications/{id}/notes', [ApplicationController::class, 'addNote']);
            Route::get('/applications/{id}/notes', [ApplicationController::class, 'getNotes']);
            Route::get('/applications/{id}/cv', [ApplicationController::class, 'downloadCv']);

            // Onboarding
            Route::get('/applications/{applicationId}/onboarding', [OnboardingController::class, 'index']);
            Route::post('/applications/{applicationId}/onboarding', [OnboardingController::class, 'store']);
            Route::post('/applications/{applicationId}/onboarding/{taskId}/complete', [OnboardingController::class, 'complete']);
            Route::delete('/applications/{applicationId}/onboarding/{taskId}', [OnboardingController::class, 'destroy']);

            // Interviews
            Route::get('/interviews', [InterviewController::class, 'index']);
            Route::post('/interviews', [InterviewController::class, 'store']);
            Route::get('/interviews/{id}', [InterviewController::class, 'show']);
            Route::put('/interviews/{id}', [InterviewController::class, 'update']);
            Route::post('/interviews/{id}/evaluate', [InterviewController::class, 'evaluate']);

            // Reports
            Route::get('/reports/dashboard', [ReportController::class, 'dashboard']);
            Route::get('/reports/applications', [ReportController::class, 'applications']);
            Route::get('/reports/hiring-funnel', [ReportController::class, 'hiringFunnel']);

            // Read-only access needed by forms and dropdowns
            Route::get('/email-templates', [EmailTemplateController::class, 'index']);
            Route::get('/users', [UserController::class, 'index']);
            Route::get('/departments', [DepartmentController::class, 'index']);
        });

        // SA only routes
        Route::middleware('role:super_admin')->group(function () {

            // Departments (list đã có trong shared group, SA thêm CRUD)
            Route::apiResource('departments', DepartmentController::class)->except(['index']);

            // Users (list đã có trong shared group, SA thêm CRUD)
            Route::apiResource('users', UserController::class)->except(['index']);
            Route::post('/users/{id}/reset-password', [UserController::class, 'resetPassword']);

            // Email Templates (list đã có trong shared group, SA thêm CRUD)
            Route::apiResource('email-templates', EmailTemplateController::class)->except(['index']);

            // Activity Logs
            Route::get('/activity-logs', [ActivityLogController::class, 'index']);
            Route::get('/activity-logs/users', [ActivityLogController::class, 'users']);
        });
    });
});
