<?php

namespace App\Enums;

use App\Enums\Concerns\PresentsEnum;

enum ApplicationStatus: string
{
    use PresentsEnum;

    case Applied = 'applied';
    case UnderReview = 'under_review';
    case Shortlisted = 'shortlisted';
    case Rejected = 'rejected';

    public function label(): string
    {
        return match ($this) {
            self::Applied => 'Applied',
            self::UnderReview => 'Under review',
            self::Shortlisted => 'Shortlisted',
            self::Rejected => 'Rejected',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Applied => 'blue',
            self::UnderReview => 'sky',
            self::Shortlisted => 'green',
            self::Rejected => 'red-soft',
        };
    }
}
