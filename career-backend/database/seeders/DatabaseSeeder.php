<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        config(['app.seeding' => true]);

        try {
            $this->call([
                RolesAndPermissionsSeeder::class,
                HrUserSeeder::class,
                EntitySeeder::class,
                DepartmentSeeder::class,
                TeamSeeder::class,
                SkillSeeder::class,
                JobPostingSeeder::class,
                CandidateSeeder::class,
                TalentMemberSeeder::class,
                WebsiteContentSeeder::class,
                NotificationPreferenceSeeder::class,
            ]);
        } finally {
            config(['app.seeding' => false]);
        }

        $this->command?->newLine();
        $this->command?->info('Infolks Group HR portal (local only)');
        $this->command?->info('  Admin  admin@infolksgroup.com  /  '.HrUserSeeder::PASSWORD);
        $this->command?->info('  HR     hr@infolksgroup.com     /  '.HrUserSeeder::PASSWORD);
        $this->command?->comment('Admin is asked to set up an authenticator app on the first sign-in.');
    }
}
