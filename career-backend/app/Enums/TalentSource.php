<?php

namespace App\Enums;

use App\Enums\Concerns\PresentsEnum;

enum TalentSource: string
{
    use PresentsEnum;

    case Signin = 'signin';
    case SignupForm = 'signup_form';
    case QuickApply = 'quick_apply';

    public function label(): string
    {
        return match ($this) {
            self::Signin => 'Sign in',
            self::SignupForm => 'Sign-up form',
            self::QuickApply => 'Quick apply',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Signin => 'blue',
            self::SignupForm => 'cyan',
            self::QuickApply => 'amber',
        };
    }
}
