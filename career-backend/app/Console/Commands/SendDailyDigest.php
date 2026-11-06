<?php

namespace App\Console\Commands;

use App\Enums\ApplicationStatus;
use App\Enums\ApplicationType;
use App\Enums\JobStatus;
use App\Enums\RoundStatus;
use App\Models\Application;
use App\Models\InterviewRound;
use App\Models\JobPosting;
use App\Models\NotificationPreference;
use App\Models\User;
use App\Notifications\DailyDigest;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Notification;

class SendDailyDigest extends Command
{
    protected $signature = 'hr:daily-digest';

    protected $description = 'Email the daily hiring digest to HR users who opted in';

    public function handle(): int
    {
        $recipients = User::query()->active()
            ->whereIn('id', NotificationPreference::query()->where('type', 'daily_digest')->where('email', true)->select('user_id'))
            ->get();

        if ($recipients->isEmpty()) {
            $this->info('No one has opted in to the daily digest.');

            return self::SUCCESS;
        }

        $stats = [
            'applications' => Application::query()->whereBetween('applied_at', [today()->subDay(), today()])->count(),
            'quick_apply' => Application::query()->where('type', ApplicationType::General)->where('status', ApplicationStatus::Applied)->count(),
            'interviews_today' => InterviewRound::query()->where('status', RoundStatus::Scheduled)->whereDate('scheduled_at', today())->count(),
            'closing_soon' => JobPosting::query()->where('status', JobStatus::Published)->whereBetween('last_date_to_apply', [today(), today()->addDays(7)])->count(),
            'sync_failed' => InterviewRound::query()->syncFailed()->where('status', RoundStatus::Scheduled)->count(),
        ];

        Notification::send($recipients, new DailyDigest($stats));
        $this->info('Sent the digest to '.$recipients->count().' HR users.');

        return self::SUCCESS;
    }
}
