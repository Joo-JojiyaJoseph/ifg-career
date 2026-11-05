<?php

namespace App\Policies;

use App\Models\SavedFilter;
use App\Models\User;

class SavedFilterPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->is_active;
    }

    public function view(User $user, SavedFilter $filter): bool
    {
        return $user->is_active && ($filter->user_id === $user->id || $filter->is_shared);
    }

    public function create(User $user): bool
    {
        return $user->is_active;
    }

    public function update(User $user, SavedFilter $filter): bool
    {
        return $user->is_active && $filter->user_id === $user->id;
    }

    public function delete(User $user, SavedFilter $filter): bool
    {
        return $this->update($user, $filter);
    }
}
