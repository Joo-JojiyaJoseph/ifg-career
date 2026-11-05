<?php

namespace App\Policies;

use App\Models\User;
use App\Policies\Concerns\ChecksPermission;

class InterviewRoundPolicy
{
    use ChecksPermission;

    public function viewAny(User $user): bool
    {
        return $this->allows($user, 'interviews.view');
    }

    public function view(User $user): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $this->allows($user, 'interviews.manage');
    }

    public function update(User $user): bool
    {
        return $this->allows($user, 'interviews.manage');
    }

    public function delete(User $user): bool
    {
        return $this->allows($user, 'interviews.manage');
    }
}
