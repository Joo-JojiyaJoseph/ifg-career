<?php

use App\Models\Candidate;
use App\Support\GoogleOAuthState;
use Illuminate\Cookie\CookieValuePrefix;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
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

    Socialite::shouldReceive('driver->stateless->user')->andReturn($user);
}

/** The return from Google, with the sign-in cookie the redirect step set and a matching state. */
function googleCallback($test, ?string $return = null, string $state = 'state-from-redirect', string $sentState = 'state-from-redirect')
{
    return $test->withCookie(GoogleOAuthState::COOKIE, json_encode(['states' => [$state], 'return' => $return]))
        ->get('/api/v1/auth/google/callback?code=abc&state='.$sentState);
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

    // The state sent to Google is the one kept in the sign-in cookie, which holds the return page as well.
    parse_str((string) parse_url($location, PHP_URL_QUERY), $query);
    $cookie = collect($response->headers->getCookies())->firstWhere(fn ($cookie) => $cookie->getName() === GoogleOAuthState::COOKIE);
    expect($cookie)->not->toBeNull()
        ->and($cookie->getDomain())->toBeNull()
        ->and($cookie->isHttpOnly())->toBeTrue()
        ->and($cookie->getSameSite())->toBe('lax');
    $saved = json_decode(CookieValuePrefix::remove(decrypt($cookie->getValue(), false)), true);
    expect($saved)->toBe(['states' => [$query['state']], 'return' => '/jobs/data-intern']);
    expect(session(GoogleOAuthState::SESSION_KEY))->toBe([$query['state']]);
});

it('creates a new candidate from Google and asks them to complete their profile', function () {
    fakeGoogleUser();

    googleCallback($this)->assertRedirect('http://localhost:5173/profile');

    $candidate = Candidate::query()->where('email', 'asha.menon@example.com')->firstOrFail();
    expect($candidate->google_id)->toBe('google-123')
        ->and($candidate->name)->toBe('Asha Menon');
    $this->assertAuthenticatedAs($candidate, 'candidate');
});

it('returns a candidate with a complete profile to the page they came from', function () {
    Candidate::factory()->complete()->create(['email' => 'asha.menon@example.com']);
    fakeGoogleUser();

    googleCallback($this, '/jobs/data-intern')->assertRedirect('http://localhost:5173/jobs/data-intern');
});

it('refuses a Google account whose email is not verified', function () {
    fakeGoogleUser(['email_verified' => false]);

    googleCallback($this)->assertRedirect('http://localhost:5173/?auth_error=google_failed');
    expect(Candidate::query()->count())->toBe(0);
});

it('handles a cancelled or failed Google sign-in', function () {
    Socialite::shouldReceive('driver->stateless->user')->andThrow(new RuntimeException('invalid_grant'));

    googleCallback($this)->assertRedirect('http://localhost:5173/?auth_error=google_failed');
});

it('treats a cancelled Google sign-in as failed without contacting Google', function () {
    Socialite::shouldReceive('driver->stateless->user')->never();

    $this->get('/api/v1/auth/google/callback?error=access_denied&state=x')->assertRedirect('http://localhost:5173/?auth_error=google_failed');
});

it('refuses a return from Google when the sign-in cookie is missing and logs why without personal data', function () {
    Socialite::shouldReceive('driver->stateless->user')->never();
    Log::spy();

    $this->get('/api/v1/auth/google/callback?code=abc&state=anything')->assertRedirect('http://localhost:5173/?auth_error=google_session_lost');

    Log::shouldHaveReceived('warning')->once()->withArgs(fn ($message, $context) => str_contains($message, 'neither the sign-in cookie nor the session came back')
        && array_key_exists('session_domain', $context) && array_key_exists('cookies_received', $context));
    expect(Candidate::query()->count())->toBe(0);
});

it('refuses a return from Google whose state does not match the sign-in cookie', function () {
    Socialite::shouldReceive('driver->stateless->user')->never();

    googleCallback($this, null, 'state-from-redirect', 'someone-elses-state')->assertRedirect('http://localhost:5173/?auth_error=google_session_lost');
    $this->assertGuest('candidate');
});

it('signs in with the state kept in the session when the sign-in cookie was dropped', function () {
    fakeGoogleUser();

    $this->withSession([GoogleOAuthState::SESSION_KEY => ['state-from-redirect']])
        ->get('/api/v1/auth/google/callback?code=abc&state=state-from-redirect')
        ->assertRedirect('http://localhost:5173/profile');
    $this->assertAuthenticated('candidate');
});

it('refuses a state that matches neither the cookie nor the session', function () {
    Socialite::shouldReceive('driver->stateless->user')->never();

    $this->withSession([GoogleOAuthState::SESSION_KEY => ['session-state']])
        ->get('/api/v1/auth/google/callback?code=abc&state=forged')
        ->assertRedirect('http://localhost:5173/?auth_error=google_session_lost');
});

it('signs in even when the session cookie settings are wrong for this host', function () {
    config(['session.domain' => 'localhost.invalid']);
    fakeGoogleUser();

    googleCallback($this)->assertRedirect('http://localhost:5173/profile');
});

it('answers a signed-out API request with 401 even without an Accept header', function () {
    $this->get('/api/v1/candidate/me')->assertStatus(401)->assertJsonPath('code', 'unauthenticated');
});

it('accepts the first sign-in when the button was clicked twice before leaving for Google', function () {
    $first = $this->get('/api/v1/auth/google/redirect');
    parse_str((string) parse_url($first->headers->get('Location'), PHP_URL_QUERY), $firstQuery);
    $cookie = collect($first->headers->getCookies())->firstWhere(fn ($cookie) => $cookie->getName() === GoogleOAuthState::COOKIE);

    // The second click: the browser sends the cookie from the first one, and a new state goes to Google.
    $second = $this->withCookie(GoogleOAuthState::COOKIE, CookieValuePrefix::remove(decrypt($cookie->getValue(), false)))->get('/api/v1/auth/google/redirect');
    $cookie = collect($second->headers->getCookies())->firstWhere(fn ($cookie) => $cookie->getName() === GoogleOAuthState::COOKIE);
    $saved = json_decode(CookieValuePrefix::remove(decrypt($cookie->getValue(), false)), true);
    expect($saved['states'])->toHaveCount(2)->toContain($firstQuery['state']);

    // Google answers the first one.
    fakeGoogleUser();
    $this->withCookie(GoogleOAuthState::COOKIE, json_encode($saved))
        ->get('/api/v1/auth/google/callback?code=abc&state='.$firstQuery['state'])
        ->assertRedirect('http://localhost:5173/profile');
});

it('accepts a state from a cookie written in the earlier single-state format', function () {
    fakeGoogleUser();

    $this->withCookie(GoogleOAuthState::COOKIE, json_encode(['state' => 'old-format', 'return' => null]))
        ->get('/api/v1/auth/google/callback?code=abc&state=old-format')
        ->assertRedirect('http://localhost:5173/profile');
});

it('restores Google code and state when the web server dropped the query string', function () {
    $request = Request::create('/api/v1/auth/google/callback');
    $request->server->set('REQUEST_URI', '/api/v1/auth/google/callback?state=abc&code=4%2F0Ab&scope=email&evil=1');

    expect(GoogleOAuthState::restoreQuery($request))->toBeTrue()
        ->and($request->query('state'))->toBe('abc')
        ->and($request->query('code'))->toBe('4/0Ab')
        ->and($request->query('evil'))->toBeNull();
});

it('leaves a normal return address alone', function () {
    $request = Request::create('/api/v1/auth/google/callback?state=abc&code=x');

    expect(GoogleOAuthState::restoreQuery($request))->toBeFalse()
        ->and($request->query('state'))->toBe('abc');
});
