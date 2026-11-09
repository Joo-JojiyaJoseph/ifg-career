<?php

namespace App\Support;

class PermissionCatalog
{
    public const ALL = [
        'jobs.view',
        'jobs.manage',
        'jobs.publish',
        'candidates.view',
        'candidates.update',
        'candidates.notes',
        'candidates.blacklist',
        'candidates.export',
        'candidates.resume',
        'applications.view',
        'applications.update',
        'interviews.view',
        'interviews.manage',
        'talent.view',
        'talent.export',
        'campaigns.send',
        'content.manage',
        'entities.manage',
        'reports.view',
        'settings.users',
        'settings.lists',
        'audit.view',
        'blocks.override',
    ];

    public const HR_EXCLUDED = [
        'entities.manage',
        'settings.users',
        'settings.lists',
        'audit.view',
    ];

    public const NOTIFICATION_TYPES = [
        'new_application',
        'new_quick_apply',
        'referred_application',
        'blocked_application_attempt',
        'interview_reminder',
        'calendar_sync_failed',
        'job_closing',
        'job_auto_closed',
        'export_ready',
        'campaign_finished',
        'hr_user_changed',
        'daily_digest',
    ];
}
