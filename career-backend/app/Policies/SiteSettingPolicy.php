<?php

namespace App\Policies;

use App\Models\User;
use App\Policies\Concerns\ChecksPermission;

class SiteSettingPolicy
{
    use ChecksPermission;

    public function viewAny(User $user): bool
    {
        return $this->allows($user, 'content.manage');
    }

    public function view(User $user): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $this->allows($user, 'content.manage');
    }

    public function update(User $user): bool
    {
        return $this->allows($user, 'content.manage');
    }

    public function delete(User $user): bool
    {
        return $this->allows($user, 'content.manage');
    }
}
