<?php

namespace Database\Factories;

use App\Enums\ColourTag;
use App\Enums\Gender;
use App\Enums\SignupSource;
use App\Models\Candidate;
use App\Models\Department;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Candidate>
 */
class CandidateFactory extends Factory
{
    protected $model = Candidate::class;

    public function definition(): array
    {
        return [
            'email' => fake()->unique()->safeEmail(),
            'name' => fake()->name(),
            'phone' => '+9198'.fake()->numerify('########'),
            'location' => fake()->randomElement(['Bengaluru', 'Kochi', 'Hyderabad', 'Pune', 'Chennai']),
            'signup_source' => SignupSource::Google,
            'colour_tag' => ColourTag::NotContacted,
            'email_verified_at' => now(),
            'privacy_consent_at' => now(),
        ];
    }

    public function blacklisted(): static
    {
        return $this->state(fn () => [
            'is_blacklisted' => true,
            'blacklist_reason' => 'Did not meet the group conduct standard.',
        ]);
    }

    public function quickApply(): static
    {
        return $this->state(fn () => [
            'signup_source' => SignupSource::QuickApply,
            'google_id' => null,
        ]);
    }

    public function complete(): static
    {
        return $this->state(fn () => [
            'date_of_birth' => '1996-04-12',
            'gender' => Gender::Female,
            'highest_qualification' => 'B.Tech Computer Science',
            'preferred_department_id' => Department::factory(),
            'years_experience' => 3.5,
            'current_ctc' => 800000,
            'expected_ctc' => 1100000,
            'resume_path' => 'resumes/sample.pdf',
            'resume_original_name' => 'resume.pdf',
            'resume_uploaded_at' => now(),
        ]);
    }
}
