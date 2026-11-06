<?php

use App\Console\Commands\CloseExpiredJobPostings;
use App\Console\Commands\LiftExpiredRoleBlocks;
use App\Console\Commands\NotifyJobsClosingSoon;
use App\Console\Commands\PruneNotifications;
use App\Console\Commands\SendDailyDigest;
use App\Console\Commands\SendInterviewReminders;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command(CloseExpiredJobPostings::class)->dailyAt('00:05')->timezone('Asia/Kolkata');
Schedule::command(LiftExpiredRoleBlocks::class)->hourly();
Schedule::command(SendInterviewReminders::class)->everyFiveMinutes()->withoutOverlapping();
Schedule::command(NotifyJobsClosingSoon::class)->dailyAt('09:00')->timezone('Asia/Kolkata');
Schedule::command(SendDailyDigest::class)->weekdays()->dailyAt('08:30')->timezone('Asia/Kolkata');
Schedule::command(PruneNotifications::class)->daily();
Schedule::command('queue:prune-failed --hours=720')->daily();
