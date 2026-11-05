<?php

namespace App\Policies;

use App\Models\NotificationPreference;
use App\Models\User;

class NotificationPreferencePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->is_active;
    }

    public function view(User $user, NotificationPreference $preference): bool
    {
        return $user->is_active && $preference->user_id === $user->id;
    }

    public function update(User $user, NotificationPreference $preference): bool
    {
        return $this->view($user, $preference);
    }
}
