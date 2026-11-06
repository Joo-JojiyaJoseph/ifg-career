<?php

namespace App\Notifications;

use App\Models\InterviewRound;

class CalendarSyncFailed extends HrNotification
{
    public function __construct(public InterviewRound $round) {}

    public function type(): string
    {
        return 'calendar_sync_failed';
    }

    protected function payload(): array
    {
        $round = $this->round->loadMissing('application.candidate');

        return [
            'title' => 'Google Calendar sync failed',
            'message' => 'The '.$round->round_name.' for '.($round->application?->candidate?->name ?? 'a candidate')
                .' was saved but could not be added to Google Calendar. Open Interviews to retry.',
            'url' => '/interviews?sync=failed',
            'level' => 'warning',
            'round_id' => $round->public_id,
        ];
    }
}
