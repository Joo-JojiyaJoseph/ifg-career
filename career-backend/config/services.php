<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env('GOOGLE_REDIRECT_URI', rtrim((string) env('APP_URL', 'http://localhost:8000'), '/').'/api/v1/auth/google/callback'),
        'calendar_id' => env('GOOGLE_CALENDAR_ID'),
        // Path to the Google service account JSON key (keep it outside public/, e.g. storage/app/private).
        'calendar_credentials' => (function () {
            $path = (string) env('GOOGLE_CALENDAR_CREDENTIALS', storage_path('app/private/google-calendar.json'));

            // Relative paths in .env are relative to the project folder.
            return $path !== '' && ! str_starts_with($path, '/') && ! preg_match('/^[A-Za-z]:[\\\\\/]/', $path) ? base_path($path) : $path;
        })(),
        // Optional Workspace user to act as (needs domain-wide delegation); leave empty to write as the service account.
        'calendar_impersonate' => env('GOOGLE_CALENDAR_IMPERSONATE'),
        'calendar_timezone' => env('GOOGLE_CALENDAR_TIMEZONE', 'Asia/Kolkata'),
    ],

    'turnstile' => [
        'secret' => env('TURNSTILE_SECRET'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    // Optional upload scanning. Set CLAMAV_HOST (e.g. 127.0.0.1:3310) or CLAMAV_SOCKET to turn it on.
    'clamav' => [
        'host' => env('CLAMAV_HOST'),
        'socket' => env('CLAMAV_SOCKET'),
        'timeout' => (int) env('CLAMAV_TIMEOUT', 10),
        'fail_open' => (bool) env('CLAMAV_FAIL_OPEN', false),
    ],

    'rate_limits' => [
        'public_per_minute' => (int) env('RATE_LIMIT_PUBLIC_PER_MINUTE', 600),
    ],

];
