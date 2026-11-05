<?php

namespace Database\Seeders;

use App\Enums\ApplicationSource;
use App\Enums\ApplicationStatus;
use App\Enums\ApplicationType;
use App\Enums\ColourTag;
use App\Enums\Gender;
use App\Enums\InterviewMode;
use App\Enums\RoundStatus;
use App\Enums\SignupSource;
use App\Models\Application;
use App\Models\Candidate;
use App\Models\CandidateNote;
use App\Models\Department;
use App\Models\InterviewRound;
use App\Models\JobPosting;
use App\Models\User;
use Faker\Factory;
use Illuminate\Database\Seeder;

class CandidateSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Factory::create('en_IN');
        $faker->seed(20261105);

        $jobs = JobPosting::query()->where('status', 'published')->orderBy('id')->get();
        $departments = Department::query()->orderBy('sort_order')->get();
        $hrId = User::query()->where('email', 'hr@infolksgroup.com')->value('id');
        $cities = ['Bengaluru', 'Kochi', 'Hyderabad', 'Pune', 'Chennai', 'Mumbai', 'Jaipur', 'Ahmedabad', 'Kolkata', 'Delhi'];
        $genders = [Gender::Female, Gender::Male, Gender::Other];

        for ($index = 1; $index <= 60; $index++) {
            $quickApply = $index % 6 === 0;
            $complete = $index % 4 !== 0;
            $email = sprintf('candidate%02d@example.com', $index);
            $name = $faker->firstName().' '.$faker->lastName();

            $candidate = Candidate::query()->updateOrCreate(
                ['email' => $email],
                [
                    'name' => $name,
                    'google_id' => $quickApply ? null : 'google-seed-'.$index,
                    'phone' => '+9198'.str_pad((string) (10000000 + $index), 8, '0', STR_PAD_LEFT),
                    'location' => $cities[$index % count($cities)],
                    'gender' => $genders[$index % 3],
                    'date_of_birth' => $complete ? sprintf('%d-%02d-%02d', 1990 + ($index % 10), ($index % 12) + 1, ($index % 27) + 1) : null,
                    'highest_qualification' => $complete ? 'B.Tech' : null,
                    'preferred_department_id' => $complete ? $departments[$index % $departments->count()]->id : null,
                    'years_experience' => $complete ? ($index % 12) + 0.5 : null,
                    'current_ctc' => $complete ? 400000 + ($index * 10000) : null,
                    'expected_ctc' => $complete ? 550000 + ($index * 10000) : null,
                    'resume_path' => 'resumes/seed-'.$index.'.pdf',
                    'resume_original_name' => 'resume.pdf',
                    'resume_uploaded_at' => now()->subDays($index),
                    'signup_source' => $quickApply ? SignupSource::QuickApply : SignupSource::Google,
                    'colour_tag' => $index % 3 === 0 ? ColourTag::Contacted : ColourTag::NotContacted,
                    'email_verified_at' => $quickApply ? null : now()->subDays(30),
                    'privacy_consent_at' => now()->subDays(20),
                ],
            );

            $job = $jobs[($index - 1) % $jobs->count()];
            $application = Application::query()->firstOrCreate(
                ['candidate_id' => $candidate->id, 'job_posting_id' => $job->id],
                [
                    'type' => ApplicationType::Job,
                    'source' => $index % 9 === 0 ? ApplicationSource::JobAlert : ApplicationSource::CareerWebsite,
                    'reference_id' => $index % 8 === 0 ? 'REF-'.$index : null,
                    'status' => ApplicationStatus::Applied,
                    'snapshot' => [
                        'name' => $candidate->name,
                        'email' => $candidate->email,
                        'phone' => $candidate->phone,
                        'location' => $candidate->location,
                    ],
                    'resume_path' => $candidate->resume_path,
                    'department_id' => $job->department_id,
                ],
            );

            if ($application->wasRecentlyCreated) {
                if ($index % 5 === 0) {
                    $application->update(['status' => ApplicationStatus::UnderReview]);
                }

                if ($index % 4 === 0) {
                    $application->update(['status' => ApplicationStatus::Shortlisted]);
                    InterviewRound::query()->firstOrCreate(
                        ['application_id' => $application->id, 'round_number' => 1],
                        [
                            'round_name' => 'Hiring conversation',
                            'scheduled_at' => now()->addDays(($index % 10) + 1),
                            'duration_minutes' => 45,
                            'mode' => $index % 2 === 0 ? InterviewMode::Video : InterviewMode::InPerson,
                            'location_or_link' => $index % 2 === 0 ? 'https://meet.example.com/group-'.$index : 'Infolks Group office, Kochi',
                            'interviewer_name' => 'Arjun Das',
                            'interviewer_email' => 'hr@infolksgroup.com',
                            'status' => RoundStatus::Scheduled,
                            'created_by' => $hrId,
                        ],
                    );
                }

                if ($index % 11 === 0) {
                    if ($application->status !== ApplicationStatus::Shortlisted) {
                        $application->update(['status' => ApplicationStatus::Shortlisted]);
                    }
                    $application->update(['status' => ApplicationStatus::Rejected]);
                }
            }

            if ($index % 7 === 0) {
                $department = $departments[$index % $departments->count()];
                $general = Application::query()
                    ->where('candidate_id', $candidate->id)
                    ->where('type', ApplicationType::General)
                    ->where('department_id', $department->id)
                    ->first();

                if (! $general) {
                    Application::query()->create([
                        'type' => ApplicationType::General,
                        'candidate_id' => $candidate->id,
                        'job_posting_id' => null,
                        'department_id' => $department->id,
                        'source' => ApplicationSource::QuickApply,
                        'status' => ApplicationStatus::Applied,
                        'snapshot' => ['name' => $candidate->name, 'email' => $candidate->email],
                        'resume_path' => $candidate->resume_path,
                    ]);
                }
            }

            if ($index % 4 === 0) {
                CandidateNote::query()->updateOrCreate(
                    ['candidate_id' => $candidate->id, 'body' => 'Initial screening note for '.$candidate->name.'.'],
                    ['user_id' => $hrId],
                );
            }

            if ($index === 60 && ! $candidate->is_blacklisted) {
                $candidate->update([
                    'is_blacklisted' => true,
                    'blacklist_reason' => 'Repeated policy breach during hiring.',
                ]);
            }
        }
    }
}
