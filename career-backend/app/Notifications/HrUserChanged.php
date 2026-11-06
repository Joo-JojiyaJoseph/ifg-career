<?php

namespace App\Notifications;

use App\Models\User;

class HrUserChanged extends HrNotification
{
    /**
     * @param  'added'|'role_changed'|'two_factor_reset'|'deactivated'|'activated'  $change
     */
    public function __construct(public User $subject, public string $change, public ?string $actor = null) {}

    public function type(): string
    {
        return 'hr_user_changed';
    }

    protected function payload(): array
    {
        $role = $this->subject->getRoleNames()->first() ?? 'no role';
        $by = $this->actor ? ' by '.$this->actor : '';

        return [
            'title' => match ($this->change) {
                'added' => 'New HR user added',
                'role_changed' => 'HR user role changed',
                'two_factor_reset' => 'Two-step verification reset',
                'deactivated' => 'HR user deactivated',
                default => 'HR user activated',
            },
            'message' => match ($this->change) {
                'added' => $this->subject->name.' was added as '.$role.$by.'.',
                'role_changed' => $this->subject->name.' is now '.$role.$by.'.',
                'two_factor_reset' => 'Two-step verification was reset for '.$this->subject->name.$by.'.',
                'deactivated' => $this->subject->name.' can no longer sign in'.$by.'.',
                default => $this->subject->name.' can sign in again'.$by.'.',
            },
            'url' => '/settings?tab=users',
            'level' => in_array($this->change, ['two_factor_reset', 'deactivated'], true) ? 'warning' : 'info',
        ];
    }
}
