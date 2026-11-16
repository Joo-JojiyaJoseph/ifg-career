<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Services\CandidateAuthService;
use App\Support\GoogleOAuthState;
use App\Support\GoogleRedirectCheck;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;
use Throwable;

class GoogleAuthController extends Controller
{
    public function redirect(Request $request): RedirectResponse
    {
        $return = $request->query('return');
        $return = is_string($return) && str_starts_with($return, '/') && ! str_starts_with($return, '//') ? $return : null;
        if ($return !== null) {
            session(['candidate.return' => $return]);
        }

        if (blank(config('services.google.client_id')) || blank(config('services.google.client_secret'))) {
            return $this->toCareers('/?auth_error=google_not_configured');
        }

        // Google would block an address like *.test with "Access blocked: invalid_request"; explain it here instead.
        if (GoogleRedirectCheck::problem() !== null) {
            return $this->toCareers('/?auth_error=google_redirect_invalid');
        }

        // The anti-forgery state is kept twice: in the session and in its own short-lived cookie on this host. The
        // return from Google is accepted when either matches, so one cookie being dropped (a wrong SESSION_DOMAIN,
        // a cached config, a proxy, another app's cookie on the same domain) no longer breaks sign-in.
        $state = GoogleOAuthState::generate();
        $sessionStates = session(GoogleOAuthState::SESSION_KEY);
        session([GoogleOAuthState::SESSION_KEY => GoogleOAuthState::remember(is_array($sessionStates) ? $sessionStates : [], $state)]);
        $cookieStates = GoogleOAuthState::remember(GoogleOAuthState::cookieStates(GoogleOAuthState::read($request)), $state);

        return Socialite::driver('google')
            ->stateless()
            ->with(['state' => $state])
            ->scopes(['openid', 'email', 'profile'])
            ->redirect()
            ->withCookie(GoogleOAuthState::cookie($request, $cookieStates, $return));
    }

    public function callback(Request $request, CandidateAuthService $auth): RedirectResponse
    {
        if (GoogleOAuthState::restoreQuery($request)) {
            Log::notice('Google sign-in: the web server dropped the query string of the return address; it was restored from REQUEST_URI. Fix the .htaccess rewrite (see docs/DEPLOYMENT.md).');
        }

        $saved = GoogleOAuthState::read($request);
        $cookieStates = GoogleOAuthState::cookieStates($saved);
        $sessionStates = session(GoogleOAuthState::SESSION_KEY);
        $sessionStates = array_values(array_filter(is_array($sessionStates) ? $sessionStates : [], 'is_string'));
        $problem = GoogleOAuthState::problem($request, $cookieStates, $sessionStates, $request->cookies->has(GoogleOAuthState::COOKIE));

        // A return from Google ends every pending sign-in in this browser: each state can be used once.
        session()->forget(GoogleOAuthState::SESSION_KEY);

        if ($problem !== null) {
            // Only cookie names and settings, never values or personal data, so the reason is clear in the log.
            Log::warning('Google sign-in: '.$problem, GoogleOAuthState::diagnostics($request));

            return $this->toCareers('/?auth_error='.($request->filled('error') ? 'google_failed' : 'google_session_lost'))
                ->withCookie(GoogleOAuthState::forget($request));
        }

        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
            $candidate = $auth->loginFromGoogle($googleUser);
        } catch (Throwable $exception) {
            report($exception);

            return $this->toCareers('/?auth_error=google_failed')->withCookie(GoogleOAuthState::forget($request));
        }

        $return = $saved['return'] ?? session()->pull('candidate.return');
        session()->forget('candidate.return');
        $path = is_string($return) && str_starts_with($return, '/') && ! str_starts_with($return, '//') && $candidate->profile_completed_at
            ? $return
            : ($candidate->profile_completed_at ? '/' : '/profile');

        return $this->toCareers($path)->withCookie(GoogleOAuthState::forget($request));
    }

    private function toCareers(string $path): RedirectResponse
    {
        return redirect()->away(rtrim((string) config('app.frontend_careers_url'), '/').$path);
    }
}
