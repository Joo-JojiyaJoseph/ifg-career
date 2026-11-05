<?php

namespace App\Enums;

use App\Enums\Concerns\PresentsEnum;

enum JobStatus: string
{
    use PresentsEnum;

    case Draft = 'draft';
    case Published = 'published';
    case Closed = 'closed';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draft',
            self::Published => 'Published',
            self::Closed => 'Closed',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Draft => 'slate',
            self::Published => 'green',
            self::Closed => 'slate-dark',
        };
    }
}
