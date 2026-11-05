<?php

namespace App\Enums;

use App\Enums\Concerns\PresentsEnum;

enum CampaignType: string
{
    use PresentsEnum;

    case JobAlert = 'job_alert';
    case CompanyUpdate = 'company_update';

    public function label(): string
    {
        return match ($this) {
            self::JobAlert => 'Job alert',
            self::CompanyUpdate => 'Company update',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::JobAlert => 'cyan',
            self::CompanyUpdate => 'violet',
        };
    }
}
