<?php

namespace App\Enums;

use App\Enums\Concerns\PresentsEnum;

enum CalendarSyncStatus: string
{
    use PresentsEnum;

    case Pending = 'pending';
    case Synced = 'synced';
    case Failed = 'failed';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending',
            self::Synced => 'Synced',
            self::Failed => 'Sync failed',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Pending => 'amber',
            self::Synced => 'green',
            self::Failed => 'danger',
        };
    }
}
