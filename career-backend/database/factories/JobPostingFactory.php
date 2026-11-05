<?php

namespace Database\Factories;

use App\Enums\JobLevel;
use App\Enums\JobStatus;
use App\Models\Entity;
use App\Models\JobPosting;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<JobPosting>
 */
class JobPostingFactory extends Factory
{
    protected $model = JobPosting::class;

    public function definition(): array
    {
        return [
            'title' => 'Role '.fake()->unique()->numerify('#####'),
            'entity_id' => Entity::factory(),
            'level' => JobLevel::AllLevel,
            'location' => fake()->randomElement(['Bengaluru', 'Kochi', 'Hyderabad', 'Pune', 'Chennai']),
            'summary' => fake()->paragraph(),
            'qualification' => 'A relevant degree or equivalent practical experience.',
            'experience' => '1–3 years',
            'why_join_us' => 'Work with Infolks Group teams across entities.',
            'last_date_to_apply' => now()->addMonth()->toDateString(),
            'status' => JobStatus::Draft,
        ];
    }

    public function published(): static
    {
        return $this->state(fn () => [
            'status' => JobStatus::Published,
            'last_date_to_apply' => now()->addWeeks(3)->toDateString(),
        ]);
    }

    public function closed(): static
    {
        return $this->state(fn () => [
            'status' => JobStatus::Closed,
            'last_date_to_apply' => now()->subDay()->toDateString(),
        ]);
    }

    public function internship(): static
    {
        return $this->state(fn () => [
            'level' => JobLevel::Internship,
        ]);
    }

    public function closingSoon(): static
    {
        return $this->state(fn () => [
            'status' => JobStatus::Published,
            'last_date_to_apply' => now()->addDays(3)->toDateString(),
        ]);
    }
}
