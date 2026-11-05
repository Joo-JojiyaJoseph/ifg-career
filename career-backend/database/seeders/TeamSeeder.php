<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Team;
use Illuminate\Database\Seeder;

class TeamSeeder extends Seeder
{
    public function run(): void
    {
        $map = [
            'Software Engineering' => ['Platform', 'Web', 'Mobile'],
            'Data & Analytics' => ['Data Science', 'Data Engineering'],
            'Medical Imaging' => ['Radiology Products', 'Clinical Research'],
            'Design' => ['Product Design'],
            'Quality Assurance' => ['QA Automation'],
            'Human Resources' => ['Talent'],
            'Business Development' => ['Partnerships'],
            'Operations' => ['People Operations'],
        ];

        foreach ($map as $departmentName => $teams) {
            $department = Department::query()->where('name', $departmentName)->firstOrFail();

            foreach ($teams as $name) {
                Team::query()->updateOrCreate(
                    ['department_id' => $department->id, 'name' => $name],
                    ['is_active' => true],
                );
            }
        }
    }
}
