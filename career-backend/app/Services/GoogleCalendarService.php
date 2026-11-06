<?php

namespace App\Services;

use App\Models\InterviewRound;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Minimal Google Calendar client using a service account (no SDK needed).
 *
 * Interview events are written to one shared HR calendar. Candidates are never added
 * as attendees, because the system must not send interview invitations to candidates.
 */
class GoogleCalendarService
{
    private const SCOPE = 'https://www.googleapis.com/auth/calendar';

    private const API = 'https://www.googleapis.com/calendar/v3';

    public function isConfigured(): bool
    {
        return filled(config('services.google.calendar_id')) && $this->credentials() !== null;
    }

    /**
     * Create or update the event for a round. Returns the Google event id.
     */
    public function upsert(InterviewRound $round): string
    {
        $round->loadMissing(['application.candidate', 'application.jobPosting', 'application.entity', 'application.department']);
        $body = $this->eventBody($round);
        $calendar = rawurlencode((string) config('services.google.calendar_id'));
        $query = ['sendUpdates' => $this->impersonates() ? 'all' : 'none'];

        if (filled($round->google_event_id)) {
            $response = $this->http()->patch(self::API."/calendars/{$calendar}/events/".rawurlencode($round->google_event_id).'?'.http_build_query($query), $body);

            if ($response->status() !== 404 && $response->status() !== 410) {
                $response->throw();

                return (string) $response->json('id');
            }
        }

        $response = $this->http()->post(self::API."/calendars/{$calendar}/events?".http_build_query($query), $body)->throw();

        return (string) $response->json('id');
    }

    public function delete(string $eventId): void
    {
        $calendar = rawurlencode((string) config('services.google.calendar_id'));
        $response = $this->http()->delete(self::API."/calendars/{$calendar}/events/".rawurlencode($eventId).'?sendUpdates='.($this->impersonates() ? 'all' : 'none'));

        if (! in_array($response->status(), [404, 410], true)) {
            $response->throw();
        }
    }

    /**
     * Calls the calendar API once to confirm the credentials and calendar id work.
     */
    public function test(): void
    {
        $calendar = rawurlencode((string) config('services.google.calendar_id'));
        $this->http()->get(self::API."/calendars/{$calendar}")->throw();
    }

    /**
     * @return array<string, mixed>
     */
    private function eventBody(InterviewRound $round): array
    {
        $application = $round->application;
        $candidate = $application?->candidate?->name ?? 'Candidate';
        $role = $application?->display_role ?? 'Interview';
        $entity = $application?->entity?->name;
        $timezone = (string) config('services.google.calendar_timezone', 'Asia/Kolkata');
        $start = $round->scheduled_at->copy()->setTimezone($timezone);
        $end = $start->copy()->addMinutes($round->duration_minutes ?: 60);
        $portal = rtrim((string) config('app.frontend_portal_url'), '/').'/interviews?round='.$round->public_id;

        $body = [
            'summary' => "{$round->round_name}: {$candidate} – {$role}",
            'description' => implode("\n", array_filter([
                'Role: '.$role.($entity ? ' ('.$entity.')' : ''),
                'Round '.$round->round_number.': '.$round->round_name,
                'Mode: '.$round->mode->label(),
                'Interviewer: '.$round->interviewer_name,
                filled($round->location_or_link) ? 'Where: '.$round->location_or_link : null,
                'Open in the HR portal: '.$portal,
            ])),
            'start' => ['dateTime' => $start->toRfc3339String(), 'timeZone' => $timezone],
            'end' => ['dateTime' => $end->toRfc3339String(), 'timeZone' => $timezone],
            'location' => $round->location_or_link,
            'extendedProperties' => ['private' => ['infolks_round' => (string) $round->public_id]],
            'reminders' => ['useDefault' => true],
        ];

        // Service accounts can only invite people when acting as a Workspace user.
        if ($this->impersonates() && filled($round->interviewer_email)) {
            $body['attendees'] = [['email' => $round->interviewer_email, 'displayName' => $round->interviewer_name]];
        }

        return $body;
    }

    private function http(): PendingRequest
    {
        return Http::withToken($this->accessToken())
            ->acceptJson()
            ->timeout(15)
            // Retry only network errors and Google 5xx responses; 4xx means the request itself is wrong.
            ->retry(2, 500, fn (\Throwable $exception) => ! $exception instanceof RequestException || $exception->response->serverError(), throw: false);
    }

    private function accessToken(): string
    {
        $credentials = $this->credentials() ?? throw new RuntimeException('Google Calendar is not configured.');
        $cacheKey = 'google-calendar-token:'.sha1($credentials['client_email'].'|'.config('services.google.calendar_impersonate'));

        return Cache::remember($cacheKey, now()->addMinutes(50), function () use ($credentials) {
            $now = time();
            $claims = array_filter([
                'iss' => $credentials['client_email'],
                'scope' => self::SCOPE,
                'aud' => $credentials['token_uri'] ?? 'https://oauth2.googleapis.com/token',
                'iat' => $now,
                'exp' => $now + 3600,
                'sub' => config('services.google.calendar_impersonate') ?: null,
            ]);

            $response = Http::asForm()->timeout(15)->post($claims['aud'], [
                'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion' => $this->jwt($claims, $credentials['private_key']),
            ])->throw();

            return (string) $response->json('access_token');
        });
    }

    /**
     * @param  array<string, mixed>  $claims
     */
    private function jwt(array $claims, string $privateKey): string
    {
        $encode = fn (array $part) => rtrim(strtr(base64_encode((string) json_encode($part)), '+/', '-_'), '=');
        $unsigned = $encode(['alg' => 'RS256', 'typ' => 'JWT']).'.'.$encode($claims);

        if (! openssl_sign($unsigned, $signature, $privateKey, OPENSSL_ALGO_SHA256)) {
            throw new RuntimeException('The Google service account key could not sign the request.');
        }

        return $unsigned.'.'.rtrim(strtr(base64_encode($signature), '+/', '-_'), '=');
    }

    /**
     * @return array{client_email: string, private_key: string, token_uri?: string}|null
     */
    private function credentials(): ?array
    {
        $path = (string) config('services.google.calendar_credentials');

        if ($path === '' || ! is_file($path) || ! is_readable($path)) {
            return null;
        }

        $json = json_decode((string) file_get_contents($path), true);

        return is_array($json) && filled($json['client_email'] ?? null) && filled($json['private_key'] ?? null) ? $json : null;
    }

    private function impersonates(): bool
    {
        return filled(config('services.google.calendar_impersonate'));
    }
}
