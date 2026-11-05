<?php

namespace App\Enums;

use App\Enums\Concerns\PresentsEnum;

enum InterviewMode: string
{
    use PresentsEnum;

    case InPerson = 'in_person';
    case Video = 'video';
    case Phone = 'phone';

    public function label(): string
    {
        return match ($this) {
            self::InPerson => 'In person',
            self::Video => 'Video',
            self::Phone => 'Phone',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::InPerson => 'navy',
            self::Video => 'blue',
            self::Phone => 'cyan',
        };
    }
}
