<?php

use App\Enums\ApplicationStatus;
use App\Enums\CalendarSyncStatus;
use App\Enums\JobStatus;
use App\Models\Application;
use App\Models\Candidate;
use App\Models\InterviewRound;
use App\Models\JobPosting;
use App\Models\RoleBlock;
use App\Models\User;
use App\Support\PermissionCatalog;
use Database\Seeders\HrUserSeeder;
use Database\Seeders\RolesAndPermissionsSeeder;
use PragmaRX\Google2FA\Google2FA;

test('roles give admin every permission and withhold three from hr', function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    $this->seed(HrUserSeeder::class);

    $admin = User::query()->where('email', 'admin@infolksgroup.com')->first();
    $hr = User::query()->where('email', 'hr@infolksgroup.com')->first();

    expect($admin->hasRole('Admin'))->toBeTrue()
        ->and($admin->getAllPermissions()->count())->toBe(count(PermissionCatalog::ALL))
        ->and($hr->hasPermissionTo('jobs.manage'))->toBeTrue()
        ->and($hr->hasPermissionTo('settings.users'))->toBeFalse()
        ->and($hr->hasPermissionTo('settings.lists'))->toBeFalse()
        ->and($hr->hasPermissionTo('audit.view'))->toBeFalse();
});

test('an hr user can sign in and read their session', function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    $this->seed(HrUserSeeder::class);

    $login = portalJson('POST', '/api/v1/hr/login', [
        'email' => 'hr@infolksgroup.com',
        'password' => HrUserSeeder::PASSWORD,
    ]);

    $login->assertOk()->assertJsonPath('status', 'authenticated')->assertJsonPath('data.role', 'HR');

    $this->getJson('/api/v1/hr/me')->assertOk()->assertJsonPath('data.email', 'hr@infolksgroup.com');
});

test('an admin must set up an authenticator before the session starts', function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    $this->seed(HrUserSeeder::class);

    portalJson('POST', '/api/v1/hr/login', [
        'email' => 'admin@infolksgroup.com',
        'password' => HrUserSeeder::PASSWORD,
    ])->assertOk()->assertJsonPath('status', 'two_factor_setup_required');

    $setup = portalJson('POST', '/api/v1/hr/two-factor/setup')->assertOk();
    $secret = $setup->json('data.secret');
    $code = app(Google2FA::class)->getCurrentOtp($secret);

    portalJson('POST', '/api/v1/hr/two-factor/confirm', ['code' => $code])
        ->assertOk()
        ->assertJsonPath('status', 'authenticated')
        ->assertJsonPath('data.two_factor_enabled', true)
        ->assertJsonCount(8, 'recovery_codes');
});

test('five failed passwords lock the hr account', function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    $this->seed(HrUserSeeder::class);

    for ($attempt = 0; $attempt < 5; $attempt++) {
        portalJson('POST', '/api/v1/hr/login', [
            'email' => 'hr@infolksgroup.com',
            'password' => 'wrong-password',
        ])->assertStatus(422);
    }

    $user = User::query()->where('email', 'hr@infolksgroup.com')->first();
    expect($user->failed_login_attempts)->toBe(5)
        ->and($user->locked_until)->not->toBeNull();
});

test('publishing a job records the publish time and a referral creates a role block after shortlist', function () {
    $job = JobPosting::factory()->published()->create(['title' => 'Platform Engineer']);

    expect($job->status)->toBe(JobStatus::Published)
        ->and($job->slug)->toBe('platform-engineer')
        ->and($job->role_key)->toBe('platform engineer')
        ->and($job->published_at)->not->toBeNull()
        ->and($job->is_open)->toBeTrue();

    $application = Application::factory()->create([
        'job_posting_id' => $job->id,
        'reference_id' => 'REF-1',
        'source' => \App\Enums\ApplicationSource::CareerWebsite,
    ]);

    expect($application->source)->toBe(\App\Enums\ApplicationSource::Referral)
        ->and($application->referred)->toBeTrue()
        ->and($application->entity_id)->toBe($job->entity_id);

    $application->update(['status' => ApplicationStatus::Shortlisted]);
    $application->update(['status' => ApplicationStatus::Rejected]);

    expect(RoleBlock::query()->where('candidate_id', $application->candidate_id)->where('role_key', 'platform engineer')->exists())->toBeTrue();
});

test('a not selected interview round sets the application result and blocks the role', function () {
    $round = InterviewRound::factory()->create();
    $round->update(['status' => \App\Enums\RoundStatus::NotSelected]);

    $application = $round->application()->first();

    expect($application->result)->toBe(\App\Enums\ApplicationResult::NotSelected)
        ->and($round->fresh()->calendar_sync_status)->toBe(CalendarSyncStatus::Failed)
        ->and(RoleBlock::query()->where('source_application_id', $application->id)->exists())->toBeTrue();
});

test('blacklisting a candidate flags open applications', function () {
    $application = Application::factory()->create();
    $candidate = $application->candidate;

    $candidate->update([
        'is_blacklisted' => true,
        'blacklist_reason' => 'Conduct.',
    ]);

    expect($candidate->fresh()->is_blacklisted_now)->toBeTrue()
        ->and($application->fresh()->is_flagged)->toBeTrue();
});

test('public meta lists enum options', function () {
    $this->getJson('/api/v1/public/meta')
        ->assertOk()
        ->assertJsonPath('data.enums.application_statuses.0.value', 'applied');
});

test('google sign-in explains when it is not configured', function () {
    $this->get('/api/v1/auth/google/redirect')
        ->assertRedirect('http://localhost:5173/?auth_error=google_not_configured');
});

test('a complete candidate profile is marked complete', function () {
    $candidate = Candidate::factory()->complete()->create();

    expect($candidate->profile_completion_percent)->toBe(100)
        ->and($candidate->profile_completed_at)->not->toBeNull();
});
