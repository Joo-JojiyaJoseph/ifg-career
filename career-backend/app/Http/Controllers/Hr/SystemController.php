<?php

namespace App\Http\Controllers\Hr;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\GoogleCalendarService;
use App\Support\GoogleRedirectCheck;
use App\Support\UploadDiagnostics;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Throwable;

/**
 * Settings → System health: queue status, failed jobs and integration checks (Admin only).
 */
class SystemController extends Controller
{
    public function health(Request $request, GoogleCalendarService $calendar): JsonResponse
    {
        $this->authorize('update', User::class);

        $failed = Schema::hasTable('failed_jobs')
            ? DB::table('failed_jobs')->latest('failed_at')->limit(20)->get(['uuid', 'queue', 'payload', 'failed_at', 'exception'])->map(fn ($job) => [
                'uuid' => $job->uuid,
                'queue' => $job->queue,
                'job' => class_basename((string) (json_decode($job->payload, true)['displayName'] ?? 'Job')),
                'failed_at' => $job->failed_at,
                'error' => str((string) $job->exception)->before("\n")->limit(200)->value(),
            ])
            : collect();

        return response()->json(['data' => [
            'queue' => [
                'driver' => config('queue.default'),
                'pending' => config('queue.default') === 'database' && Schema::hasTable('jobs') ? DB::table('jobs')->count() : null,
                // Minutes the oldest ready job has been waiting: more than a couple means no worker is running.
                'oldest_wait_minutes' => config('queue.default') === 'database' && Schema::hasTable('jobs')
                    ? (($oldest = DB::table('jobs')->whereNull('reserved_at')->min('available_at')) ? max(0, intdiv(now()->timestamp - (int) $oldest, 60)) : 0)
                    : null,
                'failed' => Schema::hasTable('failed_jobs') ? DB::table('failed_jobs')->count() : 0,
            ],
            'failed_jobs' => $failed,
            'integrations' => [
                ['key' => 'google_oauth', 'name' => 'Google sign-in for candidates', 'configured' => filled(config('services.google.client_id')) && filled(config('services.google.client_secret')), 'testable' => false, 'detail' => 'Return address: '.GoogleRedirectCheck::uri(), 'problem' => filled(config('services.google.client_id')) ? GoogleRedirectCheck::problem() : null],
                ['key' => 'google_calendar', 'name' => 'Google Calendar (interviews)', 'configured' => $calendar->isConfigured(), 'testable' => true],
                ['key' => 'mail', 'name' => 'Email ('.config('mail.default').')', 'configured' => config('mail.default') !== 'log' && config('mail.default') !== 'array', 'testable' => true],
                ['key' => 'turnstile', 'name' => 'Cloudflare Turnstile (spam protection)', 'configured' => filled(config('services.turnstile.secret')), 'testable' => false],
            ],
            'uploads' => UploadDiagnostics::settings(),
            'app' => ['environment' => app()->environment(), 'debug' => (bool) config('app.debug'), 'laravel' => app()->version(), 'php' => PHP_VERSION],
        ]]);
    }

    public function test(Request $request, string $integration, GoogleCalendarService $calendar): JsonResponse
    {
        $this->authorize('update', User::class);

        try {
            match ($integration) {
                'google_calendar' => $calendar->isConfigured() ? $calendar->test() : throw new \RuntimeException('Add GOOGLE_CALENDAR_ID and the service account key first.'),
                'mail' => Mail::raw('This is a test email from the Infolks Group HR portal.', fn ($message) => $message->to($request->user()->email)->subject('Infolks Group HR portal test email')),
                default => abort(404),
            };
        } catch (Throwable $exception) {
            return response()->json(['message' => 'The test failed: '.str($exception->getMessage())->limit(200)], 422);
        }

        return response()->json(['message' => $integration === 'mail' ? 'Test email sent to '.$request->user()->email.'.' : 'Google Calendar responded correctly.']);
    }

    public function retryFailed(string $uuid): JsonResponse
    {
        $this->authorize('update', User::class);
        Artisan::call('queue:retry', ['id' => [$uuid]]);

        return response()->json(['message' => 'The job was queued again.']);
    }
}
