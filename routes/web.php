<?php

use Illuminate\Support\Facades\Route;

// SPA entry – all routes handled by React Router
Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*');
