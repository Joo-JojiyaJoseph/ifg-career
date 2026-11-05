<?php

namespace App\Enums;

use App\Enums\Concerns\PresentsEnum;

enum ApplicationSource: string
{
    use PresentsEnum;

    case CareerWebsite = 'career_website';
    case JobAlert = 'job_alert';
    case Referral = 'referral';
    case QuickApply = 'quick_apply';

    public function label(): string
    {
        return match ($this) {
            self::CareerWebsite => 'Career website',
            self::JobAlert => 'Job alert',
            self::Referral => 'Referral',
            self::QuickApply => 'Quick apply',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::CareerWebsite => 'blue',
            self::JobAlert => 'cyan',
            self::Referral => 'violet',
            self::QuickApply => 'amber',
        };
    }
}
