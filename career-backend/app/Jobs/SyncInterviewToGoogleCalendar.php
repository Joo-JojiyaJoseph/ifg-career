<?php

namespace App\Jobs;

use App\Enums\CalendarSyncStatus;
use App\Models\InterviewRound;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SyncInterviewToGoogleCalendar implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public int $roundId,
        public string $action,
        public ?string $googleEventId = null,
    ) {}

    public function handle(): void
    {
        if ($this->action === 'delete') {
            return;
        }

        $round = InterviewRound::query()->find($this->roundId);

        if (! $round) {
            return;
        }

        if (blank(config('services.google.client_id')) || blank(config('services.google.calendar_id'))) {
            $round->forceFill([
                'calendar_sync_status' => CalendarSyncStatus::Failed,
                'calendar_sync_error' => 'Google Calendar is not configured.',
            ])->saveQuietly();

            return;
        }

        $round->forceFill([
            'calendar_sync_status' => CalendarSyncStatus::Pending,
            'calendar_sync_error' => 'Google Calendar sync is completed in a later phase.',
        ])->saveQuietly();
    }
}
