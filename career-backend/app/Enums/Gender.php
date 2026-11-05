<?php

namespace App\Enums;

use App\Enums\Concerns\PresentsEnum;

enum Gender: string
{
    use PresentsEnum;

    case Male = 'male';
    case Female = 'female';
    case Other = 'other';

    public function label(): string
    {
        return match ($this) {
            self::Male => 'Male',
            self::Female => 'Female',
            self::Other => 'Other',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Male => 'blue',
            self::Female => 'violet',
            self::Other => 'slate',
        };
    }
}
