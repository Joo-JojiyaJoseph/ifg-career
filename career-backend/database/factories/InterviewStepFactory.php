<?php

namespace Database\Factories;

use App\Models\InterviewStep;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<InterviewStep> */
class InterviewStepFactory extends Factory
{
    protected $model = InterviewStep::class;

    public function definition(): array
    {
        return [
            'name' => 'Application review',
            'description' => 'HR reviews your profile and resume.',
            'sort_order' => 1,
            'is_published' => true,
        ];
    }
}
