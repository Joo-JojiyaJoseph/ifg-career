<?php

namespace App\Services;

use App\Models\NotificationPreference;
use App\Models\User;
use App\Support\NotificationChannels;
use App\Support\PermissionCatalog;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class NotificationCentre
{
    public const LABELS = [
        'new_application' => ['New job application', 'When a candidate applies for a job.'],
        'new_quick_apply' => ['New Quick apply application', 'When someone sends a general application from the careers site.'],
        'referred_application' => ['Referred application', 'When an application includes an employee Reference ID.'],
        'blocked_application_attempt' => ['Blocked application attempt', 'When a blacklisted or blocked candidate tries to apply. Admin only.'],
        'interview_reminder' => ['Interview reminder', 'About 60 minutes before an interview you scheduled.'],
        'calendar_sync_failed' => ['Google Calendar sync failed', 'When an interview you scheduled could not be added to the calendar.'],
        'job_closing' => ['Job closing soon', 'Three days before the last date to apply of a job you created.'],
        'job_auto_closed' => ['Job closed automatically', 'When a job you created passes its last date to apply.'],
        'export_ready' => ['Export ready', 'When an Excel export you asked for is ready.'],
        'campaign_finished' => ['Campaign sent or failed', 'When a job alert or company update you sent has finished.'],
        'hr_user_changed' => ['HR user changes', 'When HR users are added, change role or have two-step verification reset. Admin only.'],
        'daily_digest' => ['Daily digest', 'A weekday morning email with yesterday\'s applications and today\'s interviews.'],
    ];

    /**
     * @param  array<string, mixed>  $filters
     */
    public function list(User $user, array $filters): LengthAwarePaginator
    {
        $query = $user->notifications()->latest();

        if (filled($filters['type'] ?? null)) {
            $query->where('data->type', $filters['type']);
        }

        if (($filters['read'] ?? null) === 'unread') {
            $query->whereNull('read_at');
        } elseif (($filters['read'] ?? null) === 'read') {
            $query->whereNotNull('read_at');
        }

        if (filled($filters['from'] ?? null)) {
            $query->whereDate('created_at', '>=', $filters['from']);
        }

        if (filled($filters['to'] ?? null)) {
            $query->whereDate('created_at', '<=', $filters['to']);
        }

        return $query->paginate((int) ($filters['per_page'] ?? 20))->withQueryString();
    }

    /**
     * @return array<string, int>
     */
    public function counts(User $user): array
    {
        return [
            'unread' => $user->unreadNotifications()->count(),
            'all' => $user->notifications()->count(),
        ];
    }

    /**
     * @return list<array{type: string, label: string, description: string, in_app: bool, email: bool, email_only: bool}>
     */
    public function preferences(User $user): array
    {
        $saved = $user->notificationPreferences()->get()->keyBy('type');
        $isAdmin = $user->hasRole('Admin');

        return collect(PermissionCatalog::NOTIFICATION_TYPES)
            ->reject(fn (string $type) => ! $isAdmin && in_array($type, ['blocked_application_attempt', 'hr_user_changed'], true))
            ->map(function (string $type) use ($saved) {
                $preference = $saved->get($type);
                $emailOnly = in_array($type, NotificationChannels::EMAIL_ONLY, true);

                return [
                    'type' => $type,
                    'label' => self::LABELS[$type][0] ?? $type,
                    'description' => self::LABELS[$type][1] ?? '',
                    'in_app' => $emailOnly ? false : ($preference?->in_app ?? true),
                    'email' => $preference?->email ?? in_array($type, NotificationChannels::EMAIL_BY_DEFAULT, true),
                    'email_only' => $emailOnly,
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @param  list<array{type: string, in_app: bool, email: bool}>  $preferences
     */
    public function savePreferences(User $user, array $preferences): void
    {
        DB::transaction(function () use ($user, $preferences) {
            foreach ($preferences as $preference) {
                NotificationPreference::query()->updateOrCreate(
                    ['user_id' => $user->id, 'type' => $preference['type']],
                    ['in_app' => (bool) $preference['in_app'], 'email' => (bool) $preference['email']],
                );
            }
        });
    }
}
