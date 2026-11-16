<?php

namespace App\Support;

use Illuminate\Support\Facades\Auth;

/**
 * Signs one guard out without signing the other one out too.
 *
 * HR staff (guard "web") and candidates (guard "candidate") share one session cookie, so the same browser can be
 * signed in to the portal and the careers site at once. Invalidating the whole session on sign-out (Laravel's
 * default) would end both. Instead this logs the guard out, forgets that side's own session keys, and gives the
 * session a new ID and CSRF token. Only when nobody is left signed in is the session wiped completely.
 */
class GuardSignOut
{
    /** The session key group that belongs to each guard ("hr.*" and "candidate.*"). */
    private const GROUPS = ['web' => 'hr', 'candidate' => 'candidate'];

    public static function end(string $guard): void
    {
        Auth::guard($guard)->logout();

        $session = session()->driver();
        // Keys like "hr.last_activity" are stored nested under "hr", so forgetting the group removes them all.
        if (isset(self::GROUPS[$guard])) {
            $session->forget(self::GROUPS[$guard]);
        }

        $other = $guard === 'web' ? 'candidate' : 'web';
        if (Auth::guard($other)->check()) {
            $session->migrate(true);
        } else {
            $session->invalidate();
        }
        $session->regenerateToken();
    }
}
