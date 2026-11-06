<?php

use App\Models\Candidate;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    config([
        'app.frontend_careers_url' => 'http://localhost:5173',
        'services.google.client_id' => 'test-client.apps.googleusercontent.com',
        'services.google.client_secret' => 'test-secret',
        'services.google.redirect' => 'http://localhost:8000/api/v1/auth/google/callback',
    ]);
});

function fakeGoogleUser(array $overrides = []): void
{
    $raw = $overrides + ['sub' => 'google-123', 'email' => 'asha.menon@example.com', 'name' => 'Asha Menon', 'picture' => null, 'email_verified' => true];
    $user = (new SocialiteUser)->setRaw($raw)->map([
        'id' => $raw['sub'],
        'name' => $raw['name'],
        'email' => $raw['email'],
        'avatar' => $raw['picture'],
    ]);

    Socialite::shouldReceive('driver->user')->andReturn($user);
}

it('explains when Google sign-in is not set up yet', function () {
    config(['services.google.client_id' => null]);

    $this->get('/api/v1/auth/google/redirect')
        ->assertRedirect('http://localhost:5173/?auth_error=google_not_configured');
});

it('sends the candidate to Google with the configured callback address', function () {
    $response = $this->get('/api/v1/auth/google/redirect?return=/jobs/data-intern');

    $location = $response->assertRedirect()->headers->get('Location');
    expect($location)->toStartWith('https://accounts.google.com/o/oauth2/auth')
        ->and($location)->toContain('redirect_uri='.urlencode('http://localhost:8000/api/v1/auth/google/callback'))
        ->and($location)->toMatch('/scope=[^&]*openid/')
        ->and($location)->toMatch('/scope=[^&]*email/')
        ->and($location)->toMatch('/scope=[^&]*profile/');
    expect(session('candidate.return'))->toBe('/jobs/data-intern');
});

it('creates a new candidate from Google and asks them to complete their profile', function () {
    fakeGoogleUser();

    $this->get('/api/v1/auth/google/callback')->assertRedirect('http://localhost:5173/profile');

    $candidate = Candidate::query()->where('email', 'asha.menon@example.com')->firstOrFail();
    expect($candidate->google_id)->toBe('google-123')
        ->and($candidate->name)->toBe('Asha Menon');
    $this->assertAuthenticatedAs($candidate, 'candidate');
});

it('returns a candidate with a complete profile to the page they came from', function () {
    Candidate::factory()->complete()->create(['email' => 'asha.menon@example.com']);
    fakeGoogleUser();

    $this->withSession(['candidate.return' => '/jobs/data-intern'])
        ->get('/api/v1/auth/google/callback')
        ->assertRedirect('http://localhost:5173/jobs/data-intern');
});

it('refuses a Google account whose email is not verified', function () {
    fakeGoogleUser(['email_verified' => false]);

    $this->get('/api/v1/auth/google/callback')->assertRedirect('http://localhost:5173/?auth_error=google_failed');
    expect(Candidate::query()->count())->toBe(0);
});

it('handles a cancelled or failed Google sign-in', function () {
    Socialite::shouldReceive('driver->user')->andThrow(new RuntimeException('access_denied'));

    $this->get('/api/v1/auth/google/callback')->assertRedirect('http://localhost:5173/?auth_error=google_failed');
});
