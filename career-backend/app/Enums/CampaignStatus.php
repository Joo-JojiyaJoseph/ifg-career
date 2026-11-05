<?php

namespace App\Enums;

use App\Enums\Concerns\PresentsEnum;

enum CampaignStatus: string
{
    use PresentsEnum;

    case Draft = 'draft';
    case Sending = 'sending';
    case Sent = 'sent';
    case Failed = 'failed';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draft',
            self::Sending => 'Sending',
            self::Sent => 'Sent',
            self::Failed => 'Failed',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Draft => 'slate',
            self::Sending => 'amber',
            self::Sent => 'green',
            self::Failed => 'danger',
        };
    }
}
