<?php

use App\Http\Controllers\Public\GoogleAuthController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'name' => 'Infolks Group Careers API',
        'version' => 'v1',
    ]);
});

Route::prefix('api/v1')->middleware('throttle:oauth')->group(function () {
    Route::get('auth/google/redirect', [GoogleAuthController::class, 'redirect'])->name('auth.google.redirect');
    Route::get('auth/google/callback', [GoogleAuthController::class, 'callback'])->name('auth.google.callback');
});

Route::get('unsubscribe/{token}', function () {
    return response()->json([
        'message' => 'Unsubscribe is completed in a later phase.',
    ]);
})->name('public.unsubscribe');
