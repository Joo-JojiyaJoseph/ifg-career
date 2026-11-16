<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;
use Throwable;

/**
 * Checks the settings that decide whether a sign-in survives the next request. When these are wrong, people sign in
 * and are thrown back to the sign-in page straight away. Run it on the server after changing `.env`.
 */
class CheckLoginSetup extends Command
{
    protected $signature = 'app:check-login';

    protected $description = 'Check the session, cookie, Sanctum and CORS settings that keep HR and candidates signed in';

    private int $problems = 0;

    public function handle(): int
    {
        $this->problems = 0;
        $api = $this->parse(config('app.url'), 'APP_URL');
        $portal = $this->parse(config('app.frontend_portal_url'), 'FRONTEND_PORTAL_URL');
        $careers = $this->parse(config('app.frontend_careers_url'), 'FRONTEND_CAREERS_URL');
        $sites = array_filter(['FRONTEND_PORTAL_URL' => $portal, 'FRONTEND_CAREERS_URL' => $careers]);

        if (app()->configurationIsCached()) {
            $this->warn('Config is cached. After any .env change run: php artisan config:clear && php artisan config:cache');
        }

        $this->check((bool) config('app.key'), 'APP_KEY is set.', 'APP_KEY is empty. Run php artisan key:generate once (and never change it afterwards).');

        // Where sessions are stored.
        $driver = config('session.driver');
        if ($driver === 'database') {
            $table = config('session.table', 'sessions');
            try {
                $this->check(Schema::hasTable($table), "Sessions are stored in the \"{$table}\" table.", "SESSION_DRIVER=database but the \"{$table}\" table is missing. Run php artisan migrate --force.");
            } catch (Throwable) {
                $this->check(false, '', 'The database cannot be reached, so sessions cannot be saved. Check the DB_* values.');
            }
        } elseif ($driver === 'file') {
            $path = config('session.files');
            $this->check(is_dir($path) && is_writable($path), "Session files go to {$path}.", "SESSION_DRIVER=file but {$path} is not writable. Fix the folder permissions (755 folders, owned by the cPanel user).");
        } else {
            $this->line("  Sessions use the \"{$driver}\" driver.");
        }

        if (! $api || ! $sites) {
            return $this->finish();
        }

        // The session cookie domain must cover the API and both sites, or the browser drops the cookies.
        $domain = config('session.domain');
        $hosts = array_merge(['APP_URL' => $api['host']], array_map(fn ($site) => $site['host'], $sites));
        if ($domain) {
            $bare = ltrim($domain, '.');
            foreach ($hosts as $name => $host) {
                $this->check(
                    $host === $bare || str_ends_with($host, '.'.$bare),
                    "SESSION_DOMAIN={$domain} covers {$host}.",
                    "SESSION_DOMAIN={$domain} does not cover {$host} ({$name}). Use the shared parent domain, e.g. SESSION_DOMAIN=.".$this->parent($api['host']),
                );
            }
        } else {
            $same = count(array_unique($hosts)) === 1;
            $this->check($same, 'SESSION_DOMAIN is empty and everything is on one host.', 'SESSION_DOMAIN is empty but the API and the sites are on different hosts. Set SESSION_DOMAIN=.'.$this->parent($api['host']));
        }

        // The API and the sites must share a parent domain; browsers block cookies between unrelated domains.
        $parents = array_unique(array_map(fn ($host) => $this->parent($host), $hosts));
        $this->check(count($parents) === 1, 'The API and the sites share the parent domain '.reset($parents).'.', 'The API and the sites are on different domains ('.implode(', ', $parents).'). Put them on subdomains of one domain, e.g. api.example.com, hr.example.com and careers.example.com.');

        // https everywhere, and a secure cookie only when everything is https.
        $schemes = array_unique(array_merge([$api['scheme']], array_map(fn ($site) => $site['scheme'], $sites)));
        $secure = (bool) config('session.secure');
        if ($schemes === ['https']) {
            $this->check($secure, 'SESSION_SECURE_COOKIE=true on https.', 'Everything is on https but SESSION_SECURE_COOKIE is not true. Set SESSION_SECURE_COOKIE=true.');
        } else {
            $this->check(! $secure, 'SESSION_SECURE_COOKIE=false while some addresses use http.', 'SESSION_SECURE_COOKIE=true but '.implode(' / ', $schemes).' is in use: browsers drop secure cookies on http. Use https for all three addresses (cPanel: SSL/TLS Status > Run AutoSSL).');
        }
        if (config('session.same_site') === 'none') {
            $this->check($secure, '', 'SESSION_SAME_SITE=none needs SESSION_SECURE_COOKIE=true.');
        }

        // Sanctum only starts a session for requests from listed hosts.
        $stateful = array_map('trim', (array) config('sanctum.stateful'));
        foreach ($sites as $name => $site) {
            $this->check(
                in_array($site['authority'], $stateful, true),
                "SANCTUM_STATEFUL_DOMAINS includes {$site['authority']}.",
                "SANCTUM_STATEFUL_DOMAINS does not include {$site['authority']} ({$name}). Add it, without https:// and without a trailing slash.",
            );
        }

        // CORS must allow each site with credentials.
        $origins = (array) config('cors.allowed_origins');
        $this->check((bool) config('cors.supports_credentials'), 'CORS allows credentials.', 'cors.supports_credentials must be true.');
        foreach ($sites as $name => $site) {
            $this->check(in_array($site['origin'], $origins, true), "CORS allows {$site['origin']}.", "{$name} must be exactly {$site['origin']} (no trailing slash, same http/https and www as the browser address).");
        }

        return $this->finish();
    }

    /** @return array{scheme: string, host: string, authority: string, origin: string}|null */
    private function parse(?string $url, string $name): ?array
    {
        $parts = $url ? parse_url($url) : false;
        if (! $parts || empty($parts['host'])) {
            $this->check(false, '', "{$name} is not set to a full address such as https://hr.example.com.");

            return null;
        }
        if (isset($parts['path']) && trim($parts['path'], '/') !== '' && $name !== 'APP_URL') {
            $this->check(false, '', "{$name} must not contain a path ({$url}).");
        }

        $authority = $parts['host'].(isset($parts['port']) ? ':'.$parts['port'] : '');

        return [
            'scheme' => $parts['scheme'] ?? 'http',
            'host' => strtolower($parts['host']),
            'authority' => strtolower($authority),
            'origin' => ($parts['scheme'] ?? 'http').'://'.strtolower($authority),
        ];
    }

    /** "hr.infolksgroup.com" → "infolksgroup.com"; keeps three labels for country domains like "example.co.in". */
    private function parent(string $host): string
    {
        if (filter_var($host, FILTER_VALIDATE_IP) || ! str_contains($host, '.')) {
            return $host;
        }
        $labels = explode('.', $host);
        $keep = count($labels) >= 3 && strlen($labels[count($labels) - 2]) <= 3 && strlen(end($labels)) === 2 ? 3 : 2;

        return implode('.', array_slice($labels, -$keep));
    }

    private function check(bool $ok, string $pass, string $fail): void
    {
        if ($ok) {
            if ($pass !== '') {
                $this->line("  <fg=green>✓</> {$pass}");
            }

            return;
        }
        $this->problems++;
        $this->line("  <fg=red>✗</> {$fail}");
    }

    private function finish(): int
    {
        $this->newLine();
        if ($this->problems === 0) {
            $this->info('No problems found. If people are still signed out, clear the browser cookies for the domain once and try again.');

            return self::SUCCESS;
        }
        $this->error("{$this->problems} problem(s) found. Fix them in .env, then run: php artisan config:clear && php artisan config:cache");

        return self::FAILURE;
    }
}
