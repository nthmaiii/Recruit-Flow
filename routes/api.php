<?php

use App\Http\Controllers\Api\Admin\DepartmentController;
use App\Http\Controllers\Api\Admin\UserController;
use App\Http\Controllers\Api\ApplicationController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\EmailTemplateController;
use App\Http\Controllers\Api\InterviewController;
use App\Http\Controllers\Api\JobController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ReportController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    // Public routes
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::get('/jobs/{slug}/public', [JobController::class, 'publicShow']);
    Route::post('/jobs/{slug}/apply', [ApplicationController::class, 'submit']);
    Route::get('/interviews/confirm/{token}', [InterviewController::class, 'confirmInterview']);

    // Authenticated routes
    Route::middleware('auth:sanctum')->group(function () {

        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/change-password', [AuthController::class, 'changePassword']);

        // Notifications
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
        Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markRead']);
        Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllRead']);

        // Candidate portal
        Route::middleware('role:CANDIDATE')->group(function () {
            Route::get('/candidate/applications', [ApplicationController::class, 'myApplications']);
        });

        // HR + HM shared
        Route::middleware('role:SA,HR,HM')->group(function () {
            Route::get('/jobs', [JobController::class, 'index']);
            Route::get('/jobs/{job}', [JobController::class, 'show']);
            Route::get('/jobs/{job}/applications', [ApplicationController::class, 'index']);
            Route::get('/applications/{application}', [ApplicationController::class, 'show']);
            Route::get('/interviews/my-schedule', [InterviewController::class, 'mySchedule']);
            Route::get('/dashboard/hm', [DashboardController::class, 'hmDashboard']);
        });

        // HM only
        Route::middleware('role:HM')->group(function () {
            Route::put('/applications/{application}/status', [ApplicationController::class, 'updateStatus']);
            Route::post('/interviews/{interview}/evaluate', [InterviewController::class, 'evaluate']);
        });

        // HR + SA
        Route::middleware('role:SA,HR')->group(function () {
            Route::post('/jobs', [JobController::class, 'store']);
            Route::put('/jobs/{job}', [JobController::class, 'update']);
            Route::delete('/jobs/{job}', [JobController::class, 'destroy']);
            Route::post('/jobs/{job}/duplicate', [JobController::class, 'duplicate']);
            Route::post('/jobs/{job}/close', [JobController::class, 'close']);

            Route::put('/applications/{application}/status', [ApplicationController::class, 'updateStatus']);
            Route::post('/applications/{application}/send-email', [ApplicationController::class, 'sendEmail']);
            Route::post('/applications/bulk-reject', [ApplicationController::class, 'bulkReject']);
            Route::get('/jobs/{job}/applications/export', [ApplicationController::class, 'export']);
            Route::patch('/applications/{application}/tags', [ApplicationController::class, 'updateTags']);

            Route::post('/applications/{application}/schedule-interview', [InterviewController::class, 'schedule']);
            Route::post('/interviews/{interview}/evaluate', [InterviewController::class, 'evaluate']);

            Route::get('/dashboard/hr', [DashboardController::class, 'hrDashboard']);
            Route::get('/reports/hiring', [ReportController::class, 'hiring']);
            Route::get('/reports/export/excel', [ReportController::class, 'exportExcel']);
            Route::get('/reports/export/pdf', [ReportController::class, 'exportPdf']);

            Route::get('/email-templates', [EmailTemplateController::class, 'index']);
            Route::get('/email-templates/{emailTemplate}', [EmailTemplateController::class, 'show']);
            Route::put('/email-templates/{emailTemplate}', [EmailTemplateController::class, 'update']);
        });

        // Admin (SA) only
        Route::middleware('role:SA')->group(function () {
            Route::get('/admin/users', [UserController::class, 'index']);
            Route::post('/admin/users', [UserController::class, 'store']);
            Route::put('/admin/users/{user}', [UserController::class, 'update']);
            Route::post('/admin/users/{user}/reset-password', [UserController::class, 'resetPassword']);
            Route::patch('/admin/users/{user}/toggle-active', [UserController::class, 'toggleActive']);
            Route::get('/admin/activity-logs', [UserController::class, 'activityLogs']);

            Route::get('/admin/departments', [DepartmentController::class, 'index']);
            Route::post('/admin/departments', [DepartmentController::class, 'store']);
            Route::put('/admin/departments/{department}', [DepartmentController::class, 'update']);
            Route::delete('/admin/departments/{department}', [DepartmentController::class, 'destroy']);
        });
    });
});
