<?php

namespace App\Enums;

use App\Enums\Concerns\PresentsEnum;

enum ColourTag: string
{
    use PresentsEnum;

    case Contacted = 'contacted';
    case NotContacted = 'not_contacted';

    public function label(): string
    {
        return match ($this) {
            self::Contacted => 'Contacted',
            self::NotContacted => 'Not contacted',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Contacted => 'green',
            self::NotContacted => 'slate',
        };
    }
}
