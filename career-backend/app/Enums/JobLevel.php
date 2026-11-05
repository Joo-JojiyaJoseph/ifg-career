<?php

namespace App\Enums;

use App\Enums\Concerns\PresentsEnum;

enum JobLevel: string
{
    use PresentsEnum;

    case Internship = 'internship';
    case AllLevel = 'all_level';

    public function label(): string
    {
        return match ($this) {
            self::Internship => 'Internship',
            self::AllLevel => 'All level',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Internship => 'cyan',
            self::AllLevel => 'blue',
        };
    }
}
