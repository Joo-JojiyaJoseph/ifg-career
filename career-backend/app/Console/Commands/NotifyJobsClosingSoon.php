<?php

namespace App\Console\Commands;

use App\Enums\JobStatus;
use App\Models\JobPosting;
use App\Notifications\JobClosingSoon;
use Illuminate\Console\Command;

class NotifyJobsClosingSoon extends Command
{
    protected $signature = 'jobs:notify-closing {--days=3}';

    protected $description = 'Tell job creators when a published job closes in a few days';

    public function handle(): int
    {
        $sent = 0;

        JobPosting::query()
            ->where('status', JobStatus::Published)
            ->whereDate('last_date_to_apply', today()->addDays((int) $this->option('days')))
            ->whereNotNull('created_by')
            ->with('creator')
            ->orderBy('id')
            ->each(function (JobPosting $job) use (&$sent): void {
                if ($job->creator?->is_active) {
                    $job->creator->notify(new JobClosingSoon($job));
                    $sent++;
                }
            });

        $this->info("Sent {$sent} closing-soon notifications.");

        return self::SUCCESS;
    }
}
