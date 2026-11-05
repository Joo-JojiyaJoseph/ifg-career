<?php

namespace App\Enums;

use App\Enums\Concerns\PresentsEnum;

enum RoundStatus: string
{
    use PresentsEnum;

    case Scheduled = 'scheduled';
    case Completed = 'completed';
    case Passed = 'passed';
    case NotSelected = 'not_selected';

    public function label(): string
    {
        return match ($this) {
            self::Scheduled => 'Scheduled',
            self::Completed => 'Completed',
            self::Passed => 'Passed',
            self::NotSelected => 'Not selected',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Scheduled => 'violet',
            self::Completed => 'sky',
            self::Passed => 'green',
            self::NotSelected => 'red-soft',
        };
    }
}
