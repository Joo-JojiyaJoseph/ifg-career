<?php

use App\Models\Candidate;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

function hrAccount(string $role, array $attributes = []): User
{
    test()->seed(RolesAndPermissionsSeeder::class);
    $user = User::factory()->create($attributes + ['is_active' => true, 'password' => 'Secret#password1']);
    $user->assignRole($role);

    return $user;
}

it('signs Admin in with email and password when two-factor is off', function () {
    config(['auth.hr_two_factor' => false]);
    $admin = hrAccount('Admin');

    $this->postJson('/api/v1/hr/login', ['email' => $admin->email, 'password' => 'Secret#password1'])
        ->assertOk()
        ->assertJsonPath('status', 'authenticated');

    $this->getJson('/api/v1/hr/me')->assertOk()->assertJsonPath('data.email', $admin->email);
});

it('skips the code check when two-factor is off, even for a user who set it up earlier', function () {
    config(['auth.hr_two_factor' => false]);
    $hr = hrAccount('HR', ['two_factor_secret' => 'JBSWY3DPEHPK3PXP', 'two_factor_confirmed_at' => now()]);

    $this->postJson('/api/v1/hr/login', ['email' => $hr->email, 'password' => 'Secret#password1'])
        ->assertOk()
        ->assertJsonPath('status', 'authenticated');
});

it('asks Admin to set up an authenticator when two-factor is on', function () {
    config(['auth.hr_two_factor' => true]);
    $admin = hrAccount('Admin');

    $this->postJson('/api/v1/hr/login', ['email' => $admin->email, 'password' => 'Secret#password1'])
        ->assertOk()
        ->assertJsonPath('status', 'two_factor_setup_required');

    $this->getJson('/api/v1/hr/me')->assertUnauthorized();
});

it('still rejects a wrong password', function () {
    config(['auth.hr_two_factor' => false]);
    $hr = hrAccount('HR');

    $this->postJson('/api/v1/hr/login', ['email' => $hr->email, 'password' => 'wrong'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('email');
});

it('keeps HR signed in when a candidate signs out in the same browser', function () {
    config(['auth.hr_two_factor' => false]);
    $hr = hrAccount('HR');
    $candidate = Candidate::factory()->complete()->create();

    $this->postJson('/api/v1/hr/login', ['email' => $hr->email, 'password' => 'Secret#password1'])->assertOk();
    Auth::guard('candidate')->login($candidate);

    $this->postJson('/api/v1/candidate/logout')->assertOk();

    expect(session()->has(Auth::guard('web')->getName()))->toBeTrue()
        ->and(session()->has(Auth::guard('candidate')->getName()))->toBeFalse();
});

it('keeps the candidate signed in when HR signs out in the same browser', function () {
    config(['auth.hr_two_factor' => false]);
    $hr = hrAccount('HR');
    $candidate = Candidate::factory()->complete()->create();

    $this->postJson('/api/v1/hr/login', ['email' => $hr->email, 'password' => 'Secret#password1'])->assertOk();
    Auth::guard('candidate')->login($candidate);

    $this->postJson('/api/v1/hr/logout')->assertOk();

    expect(session()->has(Auth::guard('candidate')->getName()))->toBeTrue()
        ->and(session()->has(Auth::guard('web')->getName()))->toBeFalse()
        ->and(session()->has('hr.last_activity'))->toBeFalse();
});

it('reports sign-in settings that would drop the session on a live host', function () {
    config([
        'app.url' => 'https://api.example.com',
        'app.frontend_portal_url' => 'https://hr.example.com',
        'app.frontend_careers_url' => 'https://careers.example.com',
        'session.domain' => 'localhost',
        'session.secure' => false,
        'sanctum.stateful' => ['localhost'],
        'cors.allowed_origins' => ['https://hr.example.com', 'https://careers.example.com'],
    ]);

    $this->artisan('app:check-login')
        ->expectsOutputToContain('does not cover hr.example.com')
        ->expectsOutputToContain('SESSION_SECURE_COOKIE is not true')
        ->expectsOutputToContain('SANCTUM_STATEFUL_DOMAINS does not include hr.example.com')
        ->assertFailed();

    config(['session.domain' => '.example.com', 'session.secure' => true, 'sanctum.stateful' => ['hr.example.com', 'careers.example.com']]);
    $this->artisan('app:check-login')->expectsOutputToContain('No problems found')->assertSuccessful();
});
