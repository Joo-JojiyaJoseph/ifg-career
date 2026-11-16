<?php

namespace App\Support;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Cookie;

/**
 * The OAuth "state" for Google sign-in. It proves the browser coming back from Google is the one that started the
 * sign-in. It is kept in the session and in a small encrypted cookie on the API host only (no Domain attribute) for
 * ten minutes; a match with either is enough. The last few states are kept, so starting sign-in again (a double
 * click, a second tab, a retry while Google asks for a phone check) does not break the one already at Google.
 * Each state works once.
 */
class GoogleOAuthState
{
    public const COOKIE = 'ifg_google_signin';

    public const SESSION_KEY = 'candidate.oauth_state';

    private const PATH = '/api/v1/auth/google';

    private const MINUTES = 10;

    /** Sign-ins started in the same browser that may still come back (a double click, a second tab, a retry). */
    private const KEEP = 5;

    public static function generate(): string
    {
        return Str::random(40);
    }

    /** The pending states with the new one added (newest last, at most KEEP). */
    public static function remember(array $states, string $state): array
    {
        $states = array_values(array_filter($states, 'is_string'));
        $states[] = $state;

        return array_slice($states, -self::KEEP);
    }

    /** States from the cookie (both the current list format and a single "state"). */
    public static function cookieStates(?array $saved): array
    {
        if ($saved === null) {
            return [];
        }
        $states = $saved['states'] ?? (isset($saved['state']) ? [$saved['state']] : []);

        return array_values(array_filter(is_array($states) ? $states : [], 'is_string'));
    }

    /** @param  array<int, string>  $states */
    public static function cookie(Request $request, array $states, ?string $return): Cookie
    {
        return self::make($request, (string) json_encode(['states' => array_values($states), 'return' => $return]), now()->addMinutes(self::MINUTES)->getTimestamp());
    }

    public static function forget(Request $request): Cookie
    {
        return self::make($request, '', 1);
    }

    /** Built directly (not with cookie()), which would add SESSION_DOMAIN: this cookie belongs to the API host only. */
    private static function make(Request $request, string $value, int $expires): Cookie
    {
        return Cookie::create(self::COOKIE, $value, $expires, self::PATH, null, $request->isSecure() || (bool) config('session.secure'), true, false, Cookie::SAMESITE_LAX);
    }

    /** @return array{state?: string, return?: string|null}|null */
    public static function read(Request $request): ?array
    {
        $value = $request->cookie(self::COOKIE);
        $data = is_string($value) ? json_decode($value, true) : null;

        return is_array($data) ? $data : null;
    }

    /**
     * Why the return from Google cannot be trusted, or null when its state is one this browser started.
     *
     * @param  array<int, string>  $cookieStates
     * @param  array<int, string>  $sessionStates
     */
    public static function problem(Request $request, array $cookieStates, array $sessionStates, bool $cookieSent = false): ?string
    {
        if ($request->filled('error')) {
            return 'Google returned an error ('.Str::limit((string) $request->query('error'), 40).')';
        }
        $state = $request->query('state');
        if (! is_string($state) || $state === '') {
            return 'Google returned no state';
        }
        foreach ([...$cookieStates, ...$sessionStates] as $expected) {
            if (hash_equals($expected, $state)) {
                return null;
            }
        }
        if ($cookieStates === [] && $sessionStates === []) {
            return $cookieSent
                ? 'the sign-in cookie could not be read and the session has no sign-in state (APP_KEY changed?)'
                : 'neither the sign-in cookie nor the session came back (blocked by the browser, a cache or a proxy?)';
        }

        return 'the state from Google is not one this browser started recently (an old or already used sign-in link)';
    }

    /**
     * Some hosting setups (an .htaccess rewrite or an http-to-https redirect without QSA) drop the query string on
     * the way to index.php, so Google's code and state never reach Laravel. The original address is still in
     * REQUEST_URI: put its parameters back. Returns true when it had to.
     */
    public static function restoreQuery(Request $request): bool
    {
        if ($request->query->count() > 0) {
            return false;
        }
        $query = parse_url((string) $request->server('REQUEST_URI'), PHP_URL_QUERY);
        if (! is_string($query) || $query === '') {
            return false;
        }
        parse_str($query, $parameters);
        $parameters = array_intersect_key($parameters, array_flip(['code', 'state', 'error', 'scope', 'authuser', 'prompt', 'hd']));
        if ($parameters === []) {
            return false;
        }
        $request->query->add($parameters);

        return true;
    }

    /** Settings and cookie names only (never values), to explain a failed sign-in in the log. */
    public static function diagnostics(Request $request): array
    {
        return [
            'host' => $request->getHost(),
            'https' => $request->isSecure(),
            'cookies_received' => array_keys($request->cookies->all()),
            'path' => $request->path(),
            'query_keys' => array_keys($request->query->all()),
            'address_has_query' => str_contains((string) $request->server('REQUEST_URI'), '?'),
            'query_string_from_server' => (string) $request->server('QUERY_STRING') !== '',
            'pending_sign_ins' => count(self::cookieStates(self::read($request))),
            'session_cookie' => config('session.cookie'),
            'session_domain' => config('session.domain'),
            'session_secure' => config('session.secure'),
            'config_cached' => app()->configurationIsCached(),
        ];
    }
}
