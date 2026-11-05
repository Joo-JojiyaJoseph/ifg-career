<?php

use App\Console\Commands\CloseExpiredJobPostings;
use App\Console\Commands\LiftExpiredRoleBlocks;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command(CloseExpiredJobPostings::class)->daily();
Schedule::command(LiftExpiredRoleBlocks::class)->hourly();
