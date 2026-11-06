<?php

use App\Enums\ApplicationResult;
use App\Enums\CalendarSyncStatus;
use App\Enums\RoundStatus;
use App\Jobs\SyncInterviewToGoogleCalendar;
use App\Models\Application;
use App\Models\InterviewRound;
use App\Models\RoleBlock;
use App\Notifications\CalendarSyncFailed;
use App\Services\GoogleCalendarService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

require_once __DIR__.'/Support.php';

uses(TestCase::class, RefreshDatabase::class);

function roundPayload(array $overrides = []): array
{
    return $overrides + [
        'round_name' => 'Technical round',
        'scheduled_at' => now()->addDays(3)->setTime(10, 0)->toIso8601String(),
        'duration_minutes' => 45,
        'mode' => 'video',
        'location_or_link' => 'https://meet.example.com/abc',
        'interviewer_name' => 'Anita Rao',
        'interviewer_email' => 'anita@infolksgroup.com',
    ];
}

it('schedules the first round for a shortlisted application and queues the calendar sync', function () {
    Queue::fake();
    actingAsHr();
    $application = Application::factory()->shortlisted()->create();

    $response = $this->postJson("/api/v1/hr/applications/{$application->public_id}/rounds", roundPayload())
        ->assertCreated()
        ->assertJsonPath('data.round_number', 1)
        ->assertJsonPath('data.status.value', 'scheduled')
        ->assertJsonPath('data.calendar.status.value', 'pending');

    expect($response->json('data.public_id'))->toHaveLength(26);
    Queue::assertPushed(SyncInterviewToGoogleCalendar::class);
});

it('does not schedule interviews for applications that are not shortlisted', function () {
    actingAsHr();
    $application = Application::factory()->create();

    $this->postJson("/api/v1/hr/applications/{$application->public_id}/rounds", roundPayload())
        ->assertUnprocessable()
        ->assertJsonValidationErrors('application');
});

it('requires the current round to finish before the next one is scheduled', function () {
    Queue::fake();
    actingAsHr();
    $round = InterviewRound::factory()->create();

    $this->postJson("/api/v1/hr/applications/{$round->application->public_id}/rounds", roundPayload())
        ->assertUnprocessable();

    $round->update(['status' => RoundStatus::Passed]);

    $this->postJson("/api/v1/hr/applications/{$round->application->public_id}/rounds", roundPayload(['round_name' => 'HR round']))
        ->assertCreated()
        ->assertJsonPath('data.round_number', 2);
});

it('warns when the interviewer already has a round at the same time', function () {
    Queue::fake();
    actingAsHr();
    $time = now()->addDays(3)->setTime(10, 0);
    InterviewRound::factory()->create(['scheduled_at' => $time, 'interviewer_email' => 'anita@infolksgroup.com']);
    $application = Application::factory()->shortlisted()->create();

    $this->postJson("/api/v1/hr/applications/{$application->public_id}/rounds", roundPayload(['scheduled_at' => $time->copy()->addMinutes(15)->toIso8601String()]))
        ->assertCreated()
        ->assertJsonCount(1, 'warnings');
});

it('marks the application Not selected and blocks the role when a round is not passed', function () {
    Queue::fake();
    actingAsHr();
    $round = InterviewRound::factory()->create();

    $this->patchJson("/api/v1/hr/rounds/{$round->public_id}/status", ['status' => 'not_selected', 'feedback' => 'Not a fit yet'])
        ->assertOk()
        ->assertJsonPath('data.status.value', 'not_selected')
        ->assertJsonPath('data.application.result.value', 'not_selected');

    expect(RoleBlock::query()->where('candidate_id', $round->application->candidate_id)->exists())->toBeTrue();
});

it('only marks a candidate Selected after every round is passed', function () {
    Queue::fake();
    actingAsHr();
    $round = InterviewRound::factory()->create();
    $application = $round->application;

    $this->patchJson("/api/v1/hr/applications/{$application->public_id}/result", ['result' => 'selected'])
        ->assertUnprocessable();

    $this->patchJson("/api/v1/hr/rounds/{$round->public_id}/status", ['status' => 'passed'])->assertOk();

    $this->patchJson("/api/v1/hr/applications/{$application->public_id}/result", ['result' => 'selected'])
        ->assertOk()
        ->assertJsonPath('data.result.value', 'selected');

    expect($application->fresh()->result)->toBe(ApplicationResult::Selected);
});

it('rejects invalid round status changes', function () {
    Queue::fake();
    actingAsHr();
    $round = InterviewRound::factory()->passed()->create();

    $this->patchJson("/api/v1/hr/rounds/{$round->public_id}/status", ['status' => 'scheduled'])
        ->assertUnprocessable();
});

it('lists rounds with counts and returns a calendar range', function () {
    Queue::fake();
    actingAsHr();
    InterviewRound::factory()->count(2)->create(['scheduled_at' => now()->addDay()]);
    InterviewRound::factory()->syncFailed()->create(['scheduled_at' => now()->addDays(2)]);

    $this->getJson('/api/v1/hr/interviews?sync=failed')
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('counts.sync.failed', 1)
        ->assertJsonPath('counts.sync.pending', 2);

    $this->getJson('/api/v1/hr/interviews?view=calendar&from='.now()->toDateString().'&to='.now()->addDays(7)->toDateString())
        ->assertOk()
        ->assertJsonCount(3, 'data');
});

it('groups shortlisted applications by interview stage', function () {
    Queue::fake();
    actingAsHr();
    Application::factory()->shortlisted()->create();
    InterviewRound::factory()->create();
    InterviewRound::factory()->passed()->create();

    $this->getJson('/api/v1/hr/interviews/pipeline')
        ->assertOk()
        ->assertJsonPath('counts.to_schedule', 1)
        ->assertJsonPath('counts.scheduled', 1)
        ->assertJsonPath('counts.awaiting_decision', 1);
});

it('cancels a scheduled round and queues the calendar delete', function () {
    Queue::fake();
    actingAsHr();
    $round = InterviewRound::factory()->create(['google_event_id' => 'evt_1']);

    $this->deleteJson("/api/v1/hr/rounds/{$round->public_id}")->assertNoContent();

    expect(InterviewRound::query()->count())->toBe(0);
    Queue::assertPushed(SyncInterviewToGoogleCalendar::class, fn ($job) => $job->action === 'delete' && $job->googleEventId === 'evt_1');
});

it('marks the round as failed when Google Calendar is not configured', function () {
    config(['services.google.calendar_id' => null]);
    Notification::fake();
    $round = InterviewRound::factory()->create();

    (new SyncInterviewToGoogleCalendar($round->id, 'upsert'))->handle(app(GoogleCalendarService::class));

    expect($round->fresh()->calendar_sync_status)->toBe(CalendarSyncStatus::Failed);
    Notification::assertNothingSent();
});

it('creates the Google Calendar event with a service account and never invites the candidate', function () {
    $path = fakeGoogleServiceAccount();

    Http::fake([
        'oauth2.googleapis.com/*' => Http::response(['access_token' => 'token-123', 'expires_in' => 3600]),
        'www.googleapis.com/calendar/*' => Http::response(['id' => 'evt_42']),
    ]);

    $round = InterviewRound::factory()->create();
    (new SyncInterviewToGoogleCalendar($round->id, 'upsert'))->handle(app(GoogleCalendarService::class));

    $round->refresh();
    expect($round->calendar_sync_status)->toBe(CalendarSyncStatus::Synced)
        ->and($round->google_event_id)->toBe('evt_42');

    Http::assertSent(function ($request) use ($round) {
        if (! str_contains($request->url(), '/calendar/v3/')) {
            return false;
        }

        $body = $request->data();

        return $request->hasHeader('Authorization', 'Bearer token-123')
            && ! isset($body['attendees'])
            && ! str_contains(json_encode($body), $round->application->candidate->email);
    });

    @unlink($path);
});

it('notifies the scheduler when the calendar rejects the event', function () {
    $path = fakeGoogleServiceAccount();
    Notification::fake();
    Http::fake([
        'oauth2.googleapis.com/*' => Http::response(['access_token' => 'token-123']),
        'www.googleapis.com/calendar/*' => Http::response(['error' => 'forbidden'], 403),
    ]);

    $user = actingAsHr();
    $round = InterviewRound::factory()->create(['created_by' => $user->id]);
    (new SyncInterviewToGoogleCalendar($round->id, 'upsert'))->handle(app(GoogleCalendarService::class));

    expect($round->fresh()->calendar_sync_status)->toBe(CalendarSyncStatus::Failed);
    Notification::assertSentTo($user, CalendarSyncFailed::class);
    @unlink($path);
});

it('retries a failed calendar sync', function () {
    Queue::fake();
    actingAsHr();
    $round = InterviewRound::factory()->syncFailed()->create();

    $this->postJson("/api/v1/hr/rounds/{$round->public_id}/retry-sync")
        ->assertOk()
        ->assertJsonPath('data.calendar.status.value', 'pending');

    Queue::assertPushed(SyncInterviewToGoogleCalendar::class);
});

it('requires a signed-in HR user', function () {
    $this->getJson('/api/v1/hr/interviews')->assertUnauthorized();
});
