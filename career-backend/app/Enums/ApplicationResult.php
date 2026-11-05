<?php

namespace App\Enums;

use App\Enums\Concerns\PresentsEnum;

enum ApplicationResult: string
{
    use PresentsEnum;

    case Selected = 'selected';
    case NotSelected = 'not_selected';

    public function label(): string
    {
        return match ($this) {
            self::Selected => 'Selected',
            self::NotSelected => 'Not selected',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Selected => 'emerald',
            self::NotSelected => 'red-soft',
        };
    }
}
