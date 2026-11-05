<?php

namespace App\Policies;

use App\Models\User;
use App\Policies\Concerns\ChecksPermission;

class DepartmentPolicy
{
    use ChecksPermission;

    public function viewAny(User $user): bool
    {
        return $this->allows($user, 'settings.lists');
    }

    public function view(User $user): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $this->allows($user, 'settings.lists');
    }

    public function update(User $user): bool
    {
        return $this->allows($user, 'settings.lists');
    }

    public function delete(User $user): bool
    {
        return $this->allows($user, 'settings.lists');
    }
}
