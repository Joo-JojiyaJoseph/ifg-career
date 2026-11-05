<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class HrUserSeeder extends Seeder
{
    public const PASSWORD = 'InfolksGroup#2026';

    public function run(): void
    {
        $admin = User::query()->updateOrCreate(
            ['email' => 'admin@infolksgroup.com'],
            [
                'name' => 'Meera Nair',
                'password' => self::PASSWORD,
                'phone' => '+914841234501',
                'is_active' => true,
                'email_verified_at' => now(),
            ],
        );
        $admin->syncRoles(['Admin']);

        $hr = User::query()->updateOrCreate(
            ['email' => 'hr@infolksgroup.com'],
            [
                'name' => 'Arjun Das',
                'password' => self::PASSWORD,
                'phone' => '+914841234502',
                'is_active' => true,
                'email_verified_at' => now(),
            ],
        );
        $hr->syncRoles(['HR']);
    }
}
