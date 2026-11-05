<?php

namespace App\Enums;

use App\Enums\Concerns\PresentsEnum;

enum MediaType: string
{
    use PresentsEnum;

    case Video = 'video';
    case Activity = 'activity';

    public function label(): string
    {
        return match ($this) {
            self::Video => 'Video',
            self::Activity => 'Activity',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Video => 'violet',
            self::Activity => 'teal',
        };
    }
}
