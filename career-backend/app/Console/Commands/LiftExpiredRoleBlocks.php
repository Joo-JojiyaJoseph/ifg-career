<?php

namespace App\Console\Commands;

use App\Models\RoleBlock;
use Illuminate\Console\Command;

class LiftExpiredRoleBlocks extends Command
{
    protected $signature = 'blocks:lift-expired';

    protected $description = 'Report role blocks whose end date has passed. Active checks use blocked_until.';

    public function handle(): int
    {
        $expired = RoleBlock::query()
            ->where('blocked_until', '<=', now())
            ->whereNull('overridden_at')
            ->count();

        $this->info("{$expired} role blocks are past their end date and are no longer active.");

        return self::SUCCESS;
    }
}
