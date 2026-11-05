<?php

namespace App\Policies;

use App\Models\User;
use App\Policies\Concerns\ChecksPermission;

class ApplicationPolicy
{
    use ChecksPermission;

    public function viewAny(User $user): bool
    {
        return $this->allows($user, 'applications.view');
    }

    public function view(User $user): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $this->allows($user, 'applications.update');
    }

    public function update(User $user): bool
    {
        return $this->allows($user, 'applications.update');
    }

    public function delete(User $user): bool
    {
        return $this->allows($user, 'applications.update');
    }
}
