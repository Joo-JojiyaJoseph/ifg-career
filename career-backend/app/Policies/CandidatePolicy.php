<?php

namespace App\Policies;

use App\Models\User;
use App\Policies\Concerns\ChecksPermission;

class CandidatePolicy
{
    use ChecksPermission;

    public function viewAny(User $user): bool
    {
        return $this->allows($user, 'candidates.view');
    }

    public function view(User $user): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $this->allows($user, 'candidates.update');
    }

    public function update(User $user): bool
    {
        return $this->allows($user, 'candidates.update');
    }

    public function delete(User $user): bool
    {
        return $this->allows($user, 'candidates.update');
    }

    public function blacklist(User $user): bool
    {
        return $this->allows($user, 'candidates.blacklist');
    }

    public function resume(User $user): bool
    {
        return $this->allows($user, 'candidates.resume');
    }

    public function export(User $user): bool
    {
        return $this->allows($user, 'candidates.export');
    }
}
