<?php

use App\Http\Controllers\Public\GoogleAuthController;
use App\Http\Controllers\Public\SitemapController;
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

// Old-style links point to the careers page that confirms the unsubscribe.
Route::get('unsubscribe/{token}', function (string $token) {
    return redirect()->away(rtrim((string) config('app.frontend_careers_url'), '/').'/unsubscribe/'.rawurlencode($token));
})->where('token', '[A-Za-z0-9]{20,64}')->name('public.unsubscribe');

Route::get('sitemap.xml', SitemapController::class)->middleware('throttle:public')->name('sitemap');
