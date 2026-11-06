<?php

namespace App\Notifications;

use App\Models\InterviewRound;

class InterviewReminder extends HrNotification
{
    public function __construct(public InterviewRound $round) {}

    public function type(): string
    {
        return 'interview_reminder';
    }

    protected function payload(): array
    {
        $round = $this->round->loadMissing('application.candidate', 'application.jobPosting', 'application.department');
        $time = $round->scheduled_at->copy()->setTimezone((string) config('services.google.calendar_timezone', 'Asia/Kolkata'))->format('H:i');

        return [
            'title' => 'Interview at '.$time,
            'message' => $round->round_name.' with '.($round->application?->candidate?->name ?? 'a candidate')
                .' for '.$round->application?->display_role.' starts at '.$time.' ('.$round->mode->label().', '.$round->interviewer_name.').',
            'url' => '/interviews?view=rounds&round='.$round->public_id,
            'level' => 'info',
            'round_id' => $round->public_id,
        ];
    }
}
