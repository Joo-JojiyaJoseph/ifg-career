<?php

namespace Database\Factories;

use App\Models\Application;
use App\Models\Candidate;
use App\Models\RoleBlock;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<RoleBlock> */
class RoleBlockFactory extends Factory
{
    protected $model = RoleBlock::class;

    public function definition(): array
    {
        return [
            'candidate_id' => Candidate::factory(),
            'role_key' => 'backend engineer',
            'blocked_until' => now()->addMonths(6),
            'reason' => 'Rejected after shortlisting',
            'source_application_id' => Application::factory(),
        ];
    }
}
