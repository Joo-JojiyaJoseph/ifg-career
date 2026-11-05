<?php

namespace App\Enums;

use App\Enums\Concerns\PresentsEnum;

enum EmailType: string
{
    use PresentsEnum;

    case ApplicationConfirmation = 'application_confirmation';
    case QuickApplyConfirmation = 'quick_apply_confirmation';
    case JobAlert = 'job_alert';
    case CompanyUpdate = 'company_update';
    case HrInvite = 'hr_invite';
    case InterviewReminder = 'interview_reminder';
    case DailyDigest = 'daily_digest';

    public function label(): string
    {
        return match ($this) {
            self::ApplicationConfirmation => 'Application confirmation',
            self::QuickApplyConfirmation => 'Quick apply confirmation',
            self::JobAlert => 'Job alert',
            self::CompanyUpdate => 'Company update',
            self::HrInvite => 'HR invite',
            self::InterviewReminder => 'Interview reminder',
            self::DailyDigest => 'Daily digest',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::ApplicationConfirmation, self::QuickApplyConfirmation => 'blue',
            self::JobAlert => 'cyan',
            self::CompanyUpdate => 'violet',
            self::HrInvite => 'navy',
            self::InterviewReminder => 'amber',
            self::DailyDigest => 'slate',
        };
    }
}
