<?php

namespace App\Policies\Concerns;

use App\Models\User;

trait ChecksPermission
{
    protected function allows(User $user, string $permission): bool
    {
        return $user->is_active && $user->can($permission);
    }
}
