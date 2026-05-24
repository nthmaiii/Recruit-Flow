<?php

use Illuminate\Support\Facades\Route;

// Serve React SPA cho tất cả route không phải API
Route::get('/{any}', function () {
    $indexPath = public_path('index.html');
    if (file_exists($indexPath)) {
        return response()->file($indexPath);
    }
    return response()->json(['name' => 'RecruitFlow API', 'version' => '1.0']);
})->where('any', '^(?!api|storage|horizon).*$');
