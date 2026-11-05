<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Services\CandidateAuthService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;
use Throwable;

class GoogleAuthController extends Controller
{
    public function redirect(Request $request): RedirectResponse
    {
        $return = $request->query('return');
        if (is_string($return) && str_starts_with($return, '/') && ! str_starts_with($return, '//')) {
            session(['candidate.return' => $return]);
        }

        if (blank(config('services.google.client_id')) || blank(config('services.google.client_secret'))) {
            return $this->toCareers('/?auth_error=google_not_configured');
        }

        return Socialite::driver('google')
            ->scopes(['openid', 'email', 'profile'])
            ->redirect();
    }

    public function callback(CandidateAuthService $auth): RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')->user();
            $candidate = $auth->loginFromGoogle($googleUser);
        } catch (Throwable $exception) {
            report($exception);

            return $this->toCareers('/?auth_error=google_failed');
        }

        $return = session()->pull('candidate.return');
        if (is_string($return) && str_starts_with($return, '/') && ! str_starts_with($return, '//') && $candidate->profile_completed_at) {
            return $this->toCareers($return);
        }

        return $this->toCareers($candidate->profile_completed_at ? '/' : '/profile');
    }

    private function toCareers(string $path): RedirectResponse
    {
        return redirect()->away(rtrim((string) config('app.frontend_careers_url'), '/').$path);
    }
}
