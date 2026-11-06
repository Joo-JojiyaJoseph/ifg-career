<?php

namespace Database\Seeders;

use App\Models\NotificationPreference;
use App\Models\User;
use App\Support\NotificationChannels;
use App\Support\PermissionCatalog;
use Illuminate\Database\Seeder;

class NotificationPreferenceSeeder extends Seeder
{
    public function run(): void
    {
        User::query()->whereIn('email', ['admin@infolksgroup.com', 'hr@infolksgroup.com'])->each(function (User $user): void {
            foreach (PermissionCatalog::NOTIFICATION_TYPES as $type) {
                NotificationPreference::query()->updateOrCreate(
                    ['user_id' => $user->id, 'type' => $type],
                    [
                        'in_app' => true,
                        'email' => in_array($type, NotificationChannels::EMAIL_BY_DEFAULT, true),
                    ],
                );
            }
        });
    }
}
