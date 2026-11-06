<?php

namespace App\Support;

use App\Models\NotificationPreference;
use App\Models\User;

/**
 * Resolves which channels an HR notification uses for a user, based on their saved preferences.
 */
class NotificationChannels
{
    /** Types that email by default when the user has not set a preference. */
    public const EMAIL_BY_DEFAULT = ['interview_reminder'];

    /** Types that only ever email (no in-app entry). */
    public const EMAIL_ONLY = ['daily_digest'];

    /**
     * @return list<string>
     */
    public static function for(object $notifiable, string $type): array
    {
        if (! $notifiable instanceof User) {
            return ['database'];
        }

        if (! $notifiable->is_active) {
            return [];
        }

        $preference = $notifiable->relationLoaded('notificationPreferences')
            ? $notifiable->notificationPreferences->firstWhere('type', $type)
            : NotificationPreference::query()->where('user_id', $notifiable->id)->where('type', $type)->first();

        $inApp = $preference?->in_app ?? true;
        $email = $preference?->email ?? in_array($type, self::EMAIL_BY_DEFAULT, true);

        if (in_array($type, self::EMAIL_ONLY, true)) {
            $inApp = false;
        }

        return array_values(array_filter([
            $inApp ? 'database' : null,
            $email ? 'mail' : null,
        ]));
    }
}
