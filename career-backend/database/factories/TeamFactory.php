<?php

namespace Database\Factories;

use App\Models\Department;
use App\Models\Team;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Team>
 */
class TeamFactory extends Factory
{
    protected $model = Team::class;

    public function definition(): array
    {
        return [
            'department_id' => Department::factory(),
            'name' => 'Team '.fake()->unique()->numerify('#####'),
            'is_active' => true,
        ];
    }
}
