<?php

namespace App\Jobs;

use App\Enums\CalendarSyncStatus;
use App\Models\InterviewRound;
use App\Models\User;
use App\Notifications\CalendarSyncFailed;
use App\Services\GoogleCalendarService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

class SyncInterviewToGoogleCalendar implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public function __construct(
        public int $roundId,
        public string $action,
        public ?string $googleEventId = null,
    ) {}

    public function handle(GoogleCalendarService $calendar): void
    {
        if ($this->action === 'delete') {
            $this->deleteEvent($calendar);

            return;
        }

        $round = InterviewRound::query()->find($this->roundId);

        if (! $round) {
            return;
        }

        if (! $calendar->isConfigured()) {
            $this->fail($round, 'Google Calendar is not configured. Add GOOGLE_CALENDAR_ID and the service account key.', notify: false);

            return;
        }

        try {
            $eventId = $calendar->upsert($round);
        } catch (Throwable $exception) {
            // Keep personal data out of logs: log only the round id and the error class.
            Log::warning('Google Calendar sync failed', ['round' => $round->public_id, 'error' => class_basename($exception)]);
            $this->fail($round, $this->friendlyError($exception));

            return;
        }

        $round->forceFill([
            'google_event_id' => $eventId,
            'calendar_sync_status' => CalendarSyncStatus::Synced,
            'calendar_sync_error' => null,
            'calendar_sync_attempts' => (int) $round->calendar_sync_attempts + 1,
            'calendar_synced_at' => now(),
        ])->saveQuietly();
    }

    private function deleteEvent(GoogleCalendarService $calendar): void
    {
        if (blank($this->googleEventId) || ! $calendar->isConfigured()) {
            return;
        }

        try {
            $calendar->delete($this->googleEventId);
        } catch (Throwable $exception) {
            Log::warning('Google Calendar event delete failed', ['round' => $this->roundId, 'error' => class_basename($exception)]);
        }
    }

    private function fail(InterviewRound $round, string $message, bool $notify = true): void
    {
        $round->forceFill([
            'calendar_sync_status' => CalendarSyncStatus::Failed,
            'calendar_sync_error' => $message,
            'calendar_sync_attempts' => (int) $round->calendar_sync_attempts + 1,
        ])->saveQuietly();

        $recipient = $round->created_by ? User::query()->find($round->created_by) : null;

        if ($notify && $recipient) {
            $recipient->notify(new CalendarSyncFailed($round));
        }
    }

    private function friendlyError(Throwable $exception): string
    {
        $status = method_exists($exception, 'getCode') ? (int) $exception->getCode() : 0;

        return match (true) {
            $status === 401, $status === 403 => 'Google refused access. Check the service account has access to the HR calendar.',
            $status === 404 => 'The HR calendar was not found. Check GOOGLE_CALENDAR_ID.',
            default => Str::limit('Google Calendar could not be reached. Try again in a minute.', 250),
        };
    }
}
