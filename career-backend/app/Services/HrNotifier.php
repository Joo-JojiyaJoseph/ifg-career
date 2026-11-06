<?php

namespace App\Services;

use App\Models\Application;
use App\Models\Candidate;
use App\Models\User;
use App\Notifications\BlockedApplicationAttempt;
use App\Notifications\HrUserChanged;
use App\Notifications\NewApplicationReceived;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Notification as Notifier;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Throwable;

/**
 * Picks the right HR recipients for system events. Failures never break the request that triggered them.
 */
class HrNotifier
{
    public function newApplication(Application $application): void
    {
        $this->send(fn () => $this->withPermission('applications.view'), new NewApplicationReceived($application));
    }

    public function blockedAttempt(Candidate $candidate, string $role, string $reason): void
    {
        $this->send(fn () => $this->admins(), new BlockedApplicationAttempt($candidate, $role, $reason));
    }

    public function userChanged(User $subject, string $change, ?User $actor = null): void
    {
        $this->send(
            fn () => $this->admins()->reject(fn (User $admin) => $actor && $admin->is($actor)),
            new HrUserChanged($subject, $change, $actor?->name),
        );
    }

    /**
     * @return Collection<int, User>
     */
    public function withPermission(string $permission): Collection
    {
        if (! Permission::query()->where('name', $permission)->where('guard_name', 'web')->exists()) {
            return new Collection;
        }

        return User::query()->active()->permission($permission)->with('notificationPreferences')->get();
    }

    /**
     * @return Collection<int, User>
     */
    public function admins(): Collection
    {
        if (! Role::query()->where('name', 'Admin')->where('guard_name', 'web')->exists()) {
            return new Collection;
        }

        return User::query()->active()->role('Admin')->with('notificationPreferences')->get();
    }

    /**
     * @param  callable(): Collection<int, User>  $recipients
     */
    private function send(callable $recipients, Notification $notification): void
    {
        if (config('app.seeding')) {
            return;
        }

        try {
            $users = $recipients();

            if ($users->isNotEmpty()) {
                Notifier::send($users, $notification);
            }
        } catch (Throwable $exception) {
            report($exception);
        }
    }
}
