<?php

namespace App\Services;

use App\Models\User;
use App\Notifications\HrInvite;
use App\Support\PermissionCatalog;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class HrUserService
{
    public function __construct(private readonly HrNotifier $notifier) {}

    /**
     * @param  array<string, mixed>  $filters
     */
    public function list(array $filters): LengthAwarePaginator
    {
        $like = filled($filters['q'] ?? null) ? '%'.str_replace(['%', '_'], ['\%', '\_'], (string) $filters['q']).'%' : null;

        return User::query()
            ->with('roles:id,name')
            ->when($like, fn ($query) => $query->where(fn ($inner) => $inner->where('name', 'like', $like)->orWhere('email', 'like', $like)))
            ->when(filled($filters['role'] ?? null), fn ($query) => $query->role($filters['role']))
            ->when(isset($filters['active']) && $filters['active'] !== null, fn ($query) => $query->where('is_active', (bool) $filters['active']))
            ->orderBy('name')
            ->paginate(50)
            ->withQueryString();
    }

    /**
     * @param  array{name: string, email: string, phone?: ?string, role: string}  $data
     */
    public function invite(array $data, User $actor): User
    {
        $user = DB::transaction(function () use ($data) {
            $user = User::query()->create([
                'name' => $data['name'],
                'email' => mb_strtolower($data['email']),
                'phone' => $data['phone'] ?? null,
                // Unknown random password: the person sets their own from the invite link.
                'password' => Str::password(40),
                'is_active' => true,
            ]);
            $user->syncRoles([$data['role']]);

            return $user;
        });

        $user->notify(new HrInvite(Password::broker('users')->createToken($user), $actor->name));
        $this->notifier->userChanged($user, 'added', $actor);

        return $user->load('roles');
    }

    /**
     * @param  array{name?: string, phone?: ?string, role?: string}  $data
     */
    public function update(User $user, array $data, User $actor): User
    {
        $roleChanged = isset($data['role']) && ! $user->hasRole($data['role']);

        if ($roleChanged && $user->hasRole('Admin')) {
            $this->assertNotLastAdmin($user, 'At least one active Admin is needed.');
        }

        if ($roleChanged && $user->is($actor)) {
            throw ValidationException::withMessages(['role' => 'You cannot change your own role.']);
        }

        $user->fill(array_intersect_key($data, array_flip(['name', 'phone'])))->save();

        if ($roleChanged) {
            $user->syncRoles([$data['role']]);
            $this->notifier->userChanged($user, 'role_changed', $actor);
        }

        return $user->fresh('roles');
    }

    public function setActive(User $user, bool $active, User $actor): User
    {
        if (! $active && $user->is($actor)) {
            throw ValidationException::withMessages(['user' => 'You cannot deactivate your own account.']);
        }

        if (! $active && $user->hasRole('Admin')) {
            $this->assertNotLastAdmin($user, 'At least one active Admin is needed.');
        }

        $user->forceFill(['is_active' => $active])->save();

        if (! $active) {
            // Sign them out everywhere straight away.
            DB::table('sessions')->where('user_id', $user->id)->delete();
            $user->tokens()->delete();
        }

        $this->notifier->userChanged($user, $active ? 'activated' : 'deactivated', $actor);

        return $user->fresh('roles');
    }

    public function resetTwoFactor(User $user, User $actor): User
    {
        $user->forceFill([
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ])->save();

        $this->notifier->userChanged($user, 'two_factor_reset', $actor);

        return $user->fresh('roles');
    }

    public function resendInvite(User $user, User $actor): void
    {
        $user->notify(new HrInvite(Password::broker('users')->createToken($user), $actor->name));
    }

    /**
     * @return array{roles: list<array{name: string, locked: bool, permissions: list<string>}>, permissions: list<array{name: string, group: string}>}
     */
    public function matrix(): array
    {
        return [
            'roles' => Role::query()->where('guard_name', 'web')->with('permissions:id,name')->orderBy('name')->get()->map(fn (Role $role) => [
                'name' => $role->name,
                'locked' => $role->name === 'Admin',
                'permissions' => $role->permissions->pluck('name')->values()->all(),
            ])->all(),
            'permissions' => collect(PermissionCatalog::ALL)->map(fn (string $name) => [
                'name' => $name,
                'group' => str($name)->before('.')->value(),
            ])->all(),
        ];
    }

    /**
     * @param  array<string, list<string>>  $assignments  role name => permission names
     */
    public function saveMatrix(array $assignments): array
    {
        DB::transaction(function () use ($assignments) {
            foreach ($assignments as $roleName => $permissions) {
                if ($roleName === 'Admin') {
                    continue; // Admin always keeps every permission.
                }

                $role = Role::findByName($roleName, 'web');
                $role->syncPermissions(Permission::query()->where('guard_name', 'web')->whereIn('name', $permissions)->get());
            }
        });

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return $this->matrix();
    }

    private function assertNotLastAdmin(User $user, string $message): void
    {
        $others = User::query()->active()->role('Admin')->whereKeyNot($user->id)->count();

        if ($others === 0) {
            throw ValidationException::withMessages(['user' => $message]);
        }
    }
}
