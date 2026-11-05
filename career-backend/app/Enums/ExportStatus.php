<?php

namespace App\Enums;

use App\Enums\Concerns\PresentsEnum;

enum ExportStatus: string
{
    use PresentsEnum;

    case Queued = 'queued';
    case Processing = 'processing';
    case Ready = 'ready';
    case Failed = 'failed';

    public function label(): string
    {
        return match ($this) {
            self::Queued => 'Queued',
            self::Processing => 'Processing',
            self::Ready => 'Ready',
            self::Failed => 'Failed',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Queued => 'slate',
            self::Processing => 'amber',
            self::Ready => 'green',
            self::Failed => 'danger',
        };
    }
}
