<?php

namespace App\Console\Commands;

use App\Enums\JobStatus;
use App\Models\JobPosting;
use App\Notifications\JobAutoClosed;
use Illuminate\Console\Command;

class CloseExpiredJobPostings extends Command
{
    protected $signature = 'jobs:auto-close';

    protected $description = 'Close published job postings whose last date to apply has passed';

    public function handle(): int
    {
        $closed = 0;

        JobPosting::query()
            ->where('status', JobStatus::Published)
            ->whereDate('last_date_to_apply', '<', today())
            ->with('creator')
            ->orderBy('id')
            ->each(function (JobPosting $job) use (&$closed): void {
                $job->update(['status' => JobStatus::Closed]);
                $closed++;

                if ($job->creator?->is_active) {
                    $job->creator->notify(new JobAutoClosed($job));
                }
            });

        $this->info("Closed {$closed} job postings.");

        return self::SUCCESS;
    }
}
