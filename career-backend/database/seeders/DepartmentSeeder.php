<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Entity;
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

    /** Departments that belong to one company; the rest are group-wide. */
    public const OWNERS = [
        'Software Engineering' => 'webfolks',
        'Design' => 'webfolks',
        'Medical Imaging' => 'medrays',
    ];

    public function run(): void
    {
        $entities = Entity::query()->pluck('id', 'slug');

        foreach (self::NAMES as $index => $name) {
            Department::query()->updateOrCreate(
                ['name' => $name],
                ['is_active' => true, 'sort_order' => $index + 1, 'entity_id' => $entities[self::OWNERS[$name] ?? ''] ?? null],
            );
        }
    }
}
