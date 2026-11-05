<?php

namespace Database\Seeders;

use App\Support\PermissionCatalog;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (PermissionCatalog::ALL as $name) {
            Permission::findOrCreate($name, 'web');
        }

        $admin = Role::findOrCreate('Admin', 'web');
        $hr = Role::findOrCreate('HR', 'web');

        $admin->syncPermissions(Permission::query()->where('guard_name', 'web')->get());
        $hr->syncPermissions(
            Permission::query()
                ->where('guard_name', 'web')
                ->whereNotIn('name', PermissionCatalog::HR_EXCLUDED)
                ->get()
        );
    }
}
