<?php

namespace Database\Seeders;

use App\Models\Department;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    public const NAMES = [
        'Data Operations',
        'Software Engineering',
        'Data & Analytics',
        'Medical Imaging',
        'Design',
        'Quality Assurance',
        'Human Resources',
        'Business Development',
        'Operations',
    ];

    public function run(): void
    {
        foreach (self::NAMES as $index => $name) {
            Department::query()->updateOrCreate(
                ['name' => $name],
                ['is_active' => true, 'sort_order' => $index + 1],
            );
        }
    }
}
