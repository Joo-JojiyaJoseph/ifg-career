<?php

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
