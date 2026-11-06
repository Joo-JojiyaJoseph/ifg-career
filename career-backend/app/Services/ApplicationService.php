<?php

namespace App\Services;

use App\Enums\ApplicationSource;
use App\Enums\ApplicationStatus;
use App\Enums\ApplicationType;
use App\Enums\EmailType;
use App\Exceptions\IneligibleApplicationException;
use App\Mail\JobApplicationReceived;
use App\Models\Application;
use App\Models\Candidate;
use App\Models\EmailLog;
use App\Models\JobPosting;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class ApplicationService
{
    public function __construct(
        private ApplicationEligibilityService $eligibility,
        private FileStorageService $files,
    ) {}

    /**
     * @param  array<string, mixed>  $input
     */
    public function apply(Candidate $candidate, JobPosting $job, array $input, ?UploadedFile $resume): Application
    {
        $job->loadMissing('entity');
        $check = $this->eligibility->forJob($candidate, $job);

        if (! $check['eligible']) {
            if (in_array($check['code'], ['blacklisted', 'role_blocked'], true)) {
                app(HrNotifier::class)->blockedAttempt($candidate, $job->title, $check['code']);
            }

            throw new IneligibleApplicationException($check);
        }

        [$path, $original] = $this->resumeFor($candidate, $resume);

        $source = ($input['src'] ?? null) === 'alert'
            ? ApplicationSource::JobAlert
            : ApplicationSource::CareerWebsite;

        $application = DB::transaction(function () use ($candidate, $job, $input, $path, $original, $source, $resume) {
            $application = Application::query()->create([
                'type' => ApplicationType::Job,
                'candidate_id' => $candidate->id,
                'job_posting_id' => $job->id,
                'entity_id' => $job->entity_id,
                'department_id' => $job->department_id,
                'source' => $source,
                'reference_id' => $input['reference_id'] ?? null,
                'status' => ApplicationStatus::Applied,
                'snapshot' => [
                    'name' => $input['name'],
                    'email' => $candidate->email,
                    'phone' => $input['phone'],
                    'location' => $input['location'],
                    'gender' => $input['gender'],
                    'years_experience' => $input['years_experience'],
                    'current_ctc' => $input['current_ctc'],
                    'expected_ctc' => $input['expected_ctc'],
                    'reference_id' => $input['reference_id'] ?? null,
                    'linkedin_url' => $input['linkedin_url'] ?? null,
                    'portfolio_url' => $input['portfolio_url'] ?? null,
                    'resume_original_name' => $original,
                    'job_title' => $job->title,
                    'entity_name' => $job->entity?->name,
                ],
                'resume_path' => $path,
            ]);

            if (! empty($input['save_to_profile'])) {
                $this->saveProfile($candidate, $input, $resume, $path, $original);
            }

            return $application;
        });

        $this->queueConfirmation($application, $candidate, $job);

        return $application->load(['entity', 'jobPosting', 'department']);
    }

    /**
     * @param  array<string, mixed>  $input
     */
    private function saveProfile(Candidate $candidate, array $input, ?UploadedFile $resume, string $path, string $original): void
    {
        $candidate->fill([
            'name' => $input['name'],
            'phone' => $input['phone'],
            'location' => $input['location'],
            'gender' => $input['gender'],
            'years_experience' => $input['years_experience'],
            'current_ctc' => $input['current_ctc'],
            'expected_ctc' => $input['expected_ctc'],
            'reference_id' => $input['reference_id'] ?? null,
            'linkedin_url' => $input['linkedin_url'] ?? null,
            'portfolio_url' => $input['portfolio_url'] ?? null,
        ]);

        if ($resume) {
            $candidate->resume_path = $path;
            $candidate->resume_original_name = $original;
            $candidate->resume_uploaded_at = now();
        }

        $candidate->save();
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function resumeFor(Candidate $candidate, ?UploadedFile $resume): array
    {
        if ($resume) {
            return [$this->files->storeResume($resume), $this->files->originalName($resume)];
        }

        $existing = $candidate->resume_path;

        if (blank($existing) || ! Storage::disk('private')->exists($existing)) {
            throw ValidationException::withMessages([
                'resume' => 'Add your resume.',
            ]);
        }

        return [$this->files->copyResume($existing), $candidate->resume_original_name ?: 'resume'];
    }

    private function queueConfirmation(Application $application, Candidate $candidate, JobPosting $job): void
    {
        $entityName = $job->entity?->name ?: 'Infolks Group';

        EmailLog::query()->create([
            'type' => EmailType::ApplicationConfirmation,
            'recipient_email' => $candidate->email,
            'candidate_id' => $candidate->id,
            'job_posting_id' => $job->id,
            'application_id' => $application->id,
            'status' => 'queued',
        ]);

        Mail::to($candidate->email)->queue(new JobApplicationReceived(
            role: $job->title,
            entityName: $entityName,
            applicationsUrl: rtrim((string) config('app.frontend_careers_url'), '/').'/my-applications',
            recipientEmail: $candidate->email,
        ));
    }
}
