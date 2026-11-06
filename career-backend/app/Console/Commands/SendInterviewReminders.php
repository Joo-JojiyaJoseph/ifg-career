<?php

namespace App\Console\Commands;

use App\Enums\RoundStatus;
use App\Models\InterviewRound;
use App\Notifications\InterviewReminder;
use Illuminate\Console\Command;

class SendInterviewReminders extends Command
{
    protected $signature = 'interviews:send-reminders {--minutes=60 : How far ahead to remind}';

    protected $description = 'Remind the HR user who scheduled each interview shortly before it starts';

    public function handle(): int
    {
        $sent = 0;

        InterviewRound::query()
            ->where('status', RoundStatus::Scheduled)
            ->whereNull('reminder_sent_at')
            ->whereBetween('scheduled_at', [now(), now()->addMinutes((int) $this->option('minutes'))])
            ->whereNotNull('created_by')
            ->with(['creator.notificationPreferences', 'application.candidate', 'application.jobPosting', 'application.department'])
            ->orderBy('id')
            ->each(function (InterviewRound $round) use (&$sent): void {
                // Mark first so a slow mail server never causes a double reminder.
                $round->forceFill(['reminder_sent_at' => now()])->saveQuietly();

                if ($round->creator?->is_active) {
                    $round->creator->notify(new InterviewReminder($round));
                    $sent++;
                }
            });

        $this->info("Sent {$sent} interview reminders.");

        return self::SUCCESS;
    }
}
