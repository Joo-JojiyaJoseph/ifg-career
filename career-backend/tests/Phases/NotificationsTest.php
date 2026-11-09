<?php

use App\Enums\JobStatus;
use App\Models\Application;
use App\Models\Candidate;
use App\Models\InterviewRound;
use App\Models\JobPosting;
use App\Models\NotificationPreference;
use App\Models\User;
use App\Notifications\BlockedApplicationAttempt;
use App\Notifications\DailyDigest;
use App\Notifications\InterviewReminder;
use App\Notifications\JobAutoClosed;
use App\Notifications\JobClosingSoon;
use App\Notifications\NewApplicationReceived;
use App\Services\HrNotifier;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

require_once __DIR__.'/Support.php';

uses(TestCase::class, RefreshDatabase::class);

function hrUserWithRole(string $role): User
{
    test()->seed(RolesAndPermissionsSeeder::class);
    $user = User::factory()->create(['is_active' => true]);
    $user->assignRole($role);

    return $user;
}

it('notifies HR users who can view applications when an application arrives', function () {
    Notification::fake();
    Queue::fake();
    $hr = hrUserWithRole('HR');
    $inactive = hrUserWithRole('HR');
    $inactive->update(['is_active' => false]);

    Application::factory()->create();

    Notification::assertSentTo($hr, NewApplicationReceived::class, fn ($notification) => $notification->type() === 'new_application');
    Notification::assertNotSentTo($inactive, NewApplicationReceived::class);
});

it('uses the referred and quick apply types for those applications', function () {
    $referred = new NewApplicationReceived(Application::factory()->make(['referred' => true]));
    $general = new NewApplicationReceived(Application::factory()->general()->make());

    expect($referred->type())->toBe('referred_application')
        ->and($general->type())->toBe('new_quick_apply');
});

it('respects each user\'s channel preferences', function () {
    Notification::fake();
    $hr = hrUserWithRole('HR');
    NotificationPreference::query()->create(['user_id' => $hr->id, 'type' => 'new_application', 'in_app' => false, 'email' => true]);
    $application = Application::factory()->create();

    Notification::assertSentTo($hr, NewApplicationReceived::class, function ($notification, array $channels) {
        return $channels === ['mail'];
    });
});

it('alerts only admins about blocked application attempts', function () {
    Notification::fake();
    $admin = hrUserWithRole('Admin');
    $hr = hrUserWithRole('HR');

    app(HrNotifier::class)->blockedAttempt(Candidate::factory()->blacklisted()->create(), 'Laravel Developer', 'blacklisted');

    Notification::assertSentTo($admin, BlockedApplicationAttempt::class);
    Notification::assertNotSentTo($hr, BlockedApplicationAttempt::class);
});

it('sends one interview reminder to the scheduler shortly before the round', function () {
    Notification::fake();
    Queue::fake();
    $hr = hrUserWithRole('HR');
    $soon = InterviewRound::factory()->create(['created_by' => $hr->id, 'scheduled_at' => now()->addMinutes(40)]);
    InterviewRound::factory()->create(['created_by' => $hr->id, 'scheduled_at' => now()->addHours(5)]);

    $this->artisan('interviews:send-reminders')->assertSuccessful();
    $this->artisan('interviews:send-reminders')->assertSuccessful();

    Notification::assertSentToTimes($hr, InterviewReminder::class, 1);
    expect($soon->fresh()->reminder_sent_at)->not->toBeNull();
});

it('tells job creators about jobs closing soon and jobs that closed', function () {
    Notification::fake();
    $hr = hrUserWithRole('HR');
    JobPosting::factory()->published()->create(['created_by' => $hr->id, 'last_date_to_apply' => today()->addDays(3)]);
    $expired = JobPosting::factory()->published()->create(['created_by' => $hr->id, 'last_date_to_apply' => today()->subDay()]);

    $this->artisan('jobs:notify-closing')->assertSuccessful();
    $this->artisan('jobs:auto-close')->assertSuccessful();

    Notification::assertSentTo($hr, JobClosingSoon::class);
    Notification::assertSentTo($hr, JobAutoClosed::class);
    expect($expired->fresh()->status)->toBe(JobStatus::Closed);
});

it('emails the daily digest only to users who opted in', function () {
    Notification::fake();
    $optedIn = hrUserWithRole('HR');
    $other = hrUserWithRole('HR');
    NotificationPreference::query()->create(['user_id' => $optedIn->id, 'type' => 'daily_digest', 'in_app' => false, 'email' => true]);

    $this->artisan('hr:daily-digest')->assertSuccessful();

    Notification::assertSentTo($optedIn, DailyDigest::class, fn ($notification, $channels) => $channels === ['mail']);
    Notification::assertNotSentTo($other, DailyDigest::class);
});

it('lists, counts and marks notifications as read for the signed-in user only', function () {
    $user = actingAsHr();
    $someoneElse = User::factory()->create();
    $application = Application::factory()->create();
    $user->notify(new NewApplicationReceived($application));
    $user->notify(new NewApplicationReceived($application));
    $someoneElse->notify(new NewApplicationReceived($application));
    $mine = $user->notifications()->first();
    $theirs = $someoneElse->notifications()->first();

    $this->getJson('/api/v1/hr/notifications/unread-count', ['X-Background-Request' => '1'])
        ->assertOk()
        ->assertJsonPath('data.unread', fn ($count) => $count >= 2);

    $this->postJson("/api/v1/hr/notifications/{$theirs->id}/read")->assertNotFound();
    $this->postJson("/api/v1/hr/notifications/{$mine->id}/read")->assertOk()->assertJsonPath('data.read_at', fn ($value) => $value !== null);

    $this->getJson('/api/v1/hr/notifications?read=unread')->assertOk()->assertJsonPath('meta.total', fn ($total) => $total >= 1);

    $this->postJson('/api/v1/hr/notifications/read-all')->assertOk();
    expect($user->unreadNotifications()->count())->toBe(0)
        ->and($someoneElse->unreadNotifications()->count())->toBe(1);
});

it('reads and saves notification preferences', function () {
    $user = actingAsHr();

    $this->getJson('/api/v1/hr/notification-preferences')
        ->assertOk()
        ->assertJsonMissing(['type' => 'hr_user_changed']);

    $this->putJson('/api/v1/hr/notification-preferences', [
        'preferences' => [
            ['type' => 'new_application', 'in_app' => false, 'email' => true],
            ['type' => 'daily_digest', 'in_app' => false, 'email' => true],
        ],
    ])->assertOk();

    expect(NotificationPreference::query()->where('user_id', $user->id)->where('type', 'daily_digest')->value('email'))->toBeTrue();
});

it('does not let background polling keep an idle portal session alive', function () {
    actingAsHr();
    session(['hr.last_activity' => now()->subMinutes(10)->toIso8601String()]);

    $this->getJson('/api/v1/hr/notifications/unread-count', ['X-Background-Request' => '1'])->assertOk();

    expect(now()->diffInMinutes(session('hr.last_activity'), true))->toBeGreaterThanOrEqual(9);
});

it('puts a new application in the bell straight away, even with no queue worker running', function () {
    config(['queue.default' => 'database']);                       // jobs wait in the table; nothing processes them
    $hr = hrUserWithRole('HR');

    Application::factory()->create();

    $this->actingAs($hr, 'web');
    $count = $this->getJson('/api/v1/hr/notifications/unread-count')->assertOk()->json();
    expect(data_get($count, 'unread', data_get($count, 'data.unread')))->toBe(1);

    $list = $this->getJson('/api/v1/hr/notifications')->assertOk()->json('data');
    expect($list[0]['type'] ?? $list[0]['data']['type'] ?? null)->toBe('new_application');

    $this->postJson('/api/v1/hr/notifications/read-all')->assertSuccessful();
    $after = $this->getJson('/api/v1/hr/notifications/unread-count')->json();
    expect(data_get($after, 'unread', data_get($after, 'data.unread')))->toBe(0);
});
