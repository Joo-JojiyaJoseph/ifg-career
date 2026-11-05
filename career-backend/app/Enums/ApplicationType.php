<?php

namespace App\Enums;

use App\Enums\Concerns\PresentsEnum;

enum ApplicationType: string
{
    use PresentsEnum;

    case Job = 'job';
    case General = 'general';

    public function label(): string
    {
        return match ($this) {
            self::Job => 'Job application',
            self::General => 'General application',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Job => 'blue',
            self::General => 'amber',
        };
    }
}
