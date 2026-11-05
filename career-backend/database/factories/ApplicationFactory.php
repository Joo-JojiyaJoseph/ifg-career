<?php

namespace Database\Factories;

use App\Enums\ApplicationSource;
use App\Enums\ApplicationStatus;
use App\Enums\ApplicationType;
use App\Models\Application;
use App\Models\Candidate;
use App\Models\Department;
use App\Models\JobPosting;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Application>
 */
class ApplicationFactory extends Factory
{
    protected $model = Application::class;

    public function definition(): array
    {
        return [
            'type' => ApplicationType::Job,
            'candidate_id' => Candidate::factory(),
            'job_posting_id' => JobPosting::factory()->published(),
            'source' => ApplicationSource::CareerWebsite,
            'status' => ApplicationStatus::Applied,
            'snapshot' => ['name' => 'Sample candidate'],
            'resume_path' => 'resumes/sample.pdf',
        ];
    }

    public function shortlisted(): static
    {
        return $this->state(fn () => [
            'status' => ApplicationStatus::Shortlisted,
            'shortlisted_at' => now(),
        ]);
    }

    public function rejectedAfterShortlist(): static
    {
        return $this->shortlisted()->afterCreating(function (Application $application): void {
            $application->update(['status' => ApplicationStatus::Rejected]);
        });
    }

    public function general(): static
    {
        return $this->state(fn () => [
            'type' => ApplicationType::General,
            'job_posting_id' => null,
            'source' => ApplicationSource::QuickApply,
            'department_id' => Department::factory(),
        ]);
    }
}
