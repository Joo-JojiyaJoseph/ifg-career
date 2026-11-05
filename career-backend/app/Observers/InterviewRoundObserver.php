<?php

namespace App\Observers;

use App\Enums\ApplicationResult;
use App\Enums\RoundStatus;
use App\Jobs\SyncInterviewToGoogleCalendar;
use App\Models\InterviewRound;

class InterviewRoundObserver
{
    public function saved(InterviewRound $round): void
    {
        $watched = [
            'scheduled_at',
            'duration_minutes',
            'mode',
            'location_or_link',
            'interviewer_name',
            'interviewer_email',
            'round_name',
            'status',
        ];

        if (! config('app.seeding') && ($round->wasRecentlyCreated || $round->wasChanged($watched))) {
            SyncInterviewToGoogleCalendar::dispatch($round->id, 'upsert');
        }

        if ($round->wasChanged('status') && $round->status === RoundStatus::NotSelected) {
            $round->application()->first()?->update([
                'result' => ApplicationResult::NotSelected,
            ]);
        }
    }

    public function deleted(InterviewRound $round): void
    {
        if (config('app.seeding')) {
            return;
        }

        SyncInterviewToGoogleCalendar::dispatch($round->id, 'delete', $round->google_event_id);
    }
}
