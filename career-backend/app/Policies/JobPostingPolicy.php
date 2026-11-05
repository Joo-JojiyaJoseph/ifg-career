<?php

namespace App\Policies;

use App\Models\User;
use App\Policies\Concerns\ChecksPermission;

class JobPostingPolicy
{
    use ChecksPermission;

    public function viewAny(User $user): bool
    {
        return $this->allows($user, 'jobs.view');
    }

    public function view(User $user): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $this->allows($user, 'jobs.manage');
    }

    public function update(User $user): bool
    {
        return $this->allows($user, 'jobs.manage');
    }

    public function delete(User $user): bool
    {
        return $this->allows($user, 'jobs.manage');
    }

    public function publish(User $user): bool
    {
        return $this->allows($user, 'jobs.publish');
    }
}
