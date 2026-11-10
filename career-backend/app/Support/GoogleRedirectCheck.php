<?php

namespace App\Support;

/**
 * Google only accepts sign-in return addresses on localhost or a real public domain, and plain http only on
 * localhost. Herd's *.test addresses are refused with "Access blocked: Error 400 invalid_request", so this
 * catches the mistake before Google does and says how to fix it.
 */
class GoogleRedirectCheck
{
    private const LOCAL_HOSTS = ['localhost', '127.0.0.1', '[::1]'];

    private const PRIVATE_SUFFIXES = ['.test', '.local', '.localhost', '.invalid', '.example', '.internal', '.lan', '.home'];

    public static function uri(): string
    {
        return (string) config('services.google.redirect');
    }

    /** What is wrong with the configured return address, or null when Google should accept it. */
    public static function problem(?string $uri = null): ?string
    {
        $uri ??= self::uri();
        $parts = parse_url($uri);
        $host = strtolower((string) ($parts['host'] ?? ''));
        $scheme = strtolower((string) ($parts['scheme'] ?? ''));

        if ($host === '' || ! in_array($scheme, ['http', 'https'], true)) {
            return 'GOOGLE_REDIRECT_URI is not a full web address. Set it to http://localhost:5173/api/v1/auth/google/callback when developing.';
        }

        if (in_array($host, self::LOCAL_HOSTS, true)) {
            return null;
        }

        foreach (self::PRIVATE_SUFFIXES as $suffix) {
            if (str_ends_with($host, $suffix)) {
                return "Google refuses return addresses ending in {$suffix} ({$host}). When developing, set GOOGLE_REDIRECT_URI to http://localhost:5173/api/v1/auth/google/callback and add that exact address in Google Cloud.";
            }
        }

        if (filter_var($host, FILTER_VALIDATE_IP)) {
            return 'Google refuses return addresses that are IP numbers. Use localhost when developing, or a real domain name.';
        }

        if ($scheme !== 'https') {
            return 'Google only accepts http:// on localhost. Use an https:// address for this domain.';
        }

        return null;
    }
}
