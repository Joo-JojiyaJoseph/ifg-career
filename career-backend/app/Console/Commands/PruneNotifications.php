<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class PruneNotifications extends Command
{
    protected $signature = 'notifications:prune {--days=90}';

    protected $description = 'Delete read notifications older than the given number of days';

    public function handle(): int
    {
        $deleted = DB::table('notifications')
            ->whereNotNull('read_at')
            ->where('created_at', '<', now()->subDays((int) $this->option('days')))
            ->delete();

        $this->info("Deleted {$deleted} old notifications.");

        return self::SUCCESS;
    }
}
