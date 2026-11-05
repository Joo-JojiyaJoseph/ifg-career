<?php

namespace App\Enums;

use App\Enums\Concerns\PresentsEnum;

enum SignupSource: string
{
    use PresentsEnum;

    case Google = 'google';
    case QuickApply = 'quick_apply';

    public function label(): string
    {
        return match ($this) {
            self::Google => 'Google',
            self::QuickApply => 'Quick apply',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Google => 'blue',
            self::QuickApply => 'amber',
        };
    }
}
