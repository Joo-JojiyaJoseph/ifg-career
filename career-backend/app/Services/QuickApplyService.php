<?php

namespace App\Services;

use App\Enums\ApplicationSource;
use App\Enums\ApplicationStatus;
use App\Enums\ApplicationType;
use App\Enums\EmailType;
use App\Enums\SignupSource;
use App\Enums\TalentSource;
use App\Exceptions\IneligibleApplicationException;
use App\Mail\QuickApplicationReceived;
use App\Models\Application;
use App\Models\Candidate;
use App\Models\Department;
use App\Models\EmailLog;
use App\Models\SiteSetting;
use App\Models\TalentMember;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class QuickApplyService
{
    public function __construct(
        private ApplicationEligibilityService $eligibility,
        private FileStorageService $files,
    ) {}

    /**
     * @param  array<string, mixed>  $input
     * @return array{application: Application, candidate: Candidate, created: bool, confirmation: string, profile_notice: ?string}
     */
    public function submit(array $input, UploadedFile $resume): array
    {
        $email = mb_strtolower((string) $input['email']);
        $department = Department::query()->findOrFail($input['department_id']);
        $candidate = Candidate::query()->where('email', $email)->first();
        $existingGoogle = $candidate && filled($candidate->google_id);
        $created = $candidate === null;

        if ($candidate) {
            $check = $this->eligibility->forGeneral($candidate, $department->id);

            if (! $check['eligible']) {
                if (in_array($check['code'], ['blacklisted', 'role_blocked'], true)) {
                    app(HrNotifier::class)->blockedAttempt($candidate, 'General – '.$department->name, $check['code']);
                }

                throw new IneligibleApplicationException($check);
            }
        }

        $path = $this->files->storeResume($resume);
        $original = $this->files->originalName($resume);

        $application = DB::transaction(function () use ($input, $email, $department, $candidate, $existingGoogle, $path, $original) {
            if (! $candidate) {
                $candidate = Candidate::query()->create([
                    'email' => $email,
                    'name' => $input['name'],
                    'date_of_birth' => $input['date_of_birth'],
                    'phone' => $input['phone'],
                    'gender' => $input['gender'],
                    'location' => $input['location'],
                    'highest_qualification' => $input['highest_qualification'],
                    'preferred_department_id' => $department->id,
                    'signup_source' => SignupSource::QuickApply,
                    'privacy_consent_at' => now(),
                    'resume_path' => $path,
                    'resume_original_name' => $original,
                    'resume_uploaded_at' => now(),
                ]);
            } elseif (! $existingGoogle) {
                $candidate->fill([
                    'name' => $input['name'],
                    'date_of_birth' => $input['date_of_birth'],
                    'phone' => $input['phone'],
                    'gender' => $input['gender'],
                    'location' => $input['location'],
                    'highest_qualification' => $input['highest_qualification'],
                    'preferred_department_id' => $department->id,
                    'privacy_consent_at' => $candidate->privacy_consent_at ?? now(),
                    'resume_path' => $path,
                    'resume_original_name' => $original,
                    'resume_uploaded_at' => now(),
                ])->save();
            }

            if (! empty($input['keep_updated'])) {
                $this->subscribe($candidate);
            }

            $application = Application::query()->create([
                'type' => ApplicationType::General,
                'candidate_id' => $candidate->id,
                'department_id' => $department->id,
                'source' => ApplicationSource::QuickApply,
                'status' => ApplicationStatus::Applied,
                'snapshot' => [
                    'name' => $input['name'],
                    'email' => $email,
                    'phone' => $input['phone'],
                    'date_of_birth' => $input['date_of_birth'],
                    'gender' => $input['gender'],
                    'highest_qualification' => $input['highest_qualification'],
                    'location' => $input['location'],
                    'department_name' => $department->name,
                    'resume_original_name' => $original,
                ],
                'resume_path' => $path,
            ]);

            return $application->load(['department', 'candidate']);
        });

        $this->queueConfirmation($application, $application->candidate, $department->name);

        return [
            'application' => $application,
            'candidate' => $application->candidate,
            'created' => $created,
            'confirmation' => $this->confirmationText(),
            // Only a brand-new profile is signed in automatically. An existing profile could belong to someone else
            // who simply typed this email address, so its owner signs in with Google to see it.
            'profile_notice' => $created
                ? null
                : 'This email already has a candidate profile. Sign in with Google to see the status of your applications.',
        ];
    }

    public function confirmationText(): string
    {
        $value = SiteSetting::get('quick_apply_confirmation');

        if (is_string($value) && $value !== '') {
            return $value;
        }

        if (is_array($value) && filled($value['text'] ?? null)) {
            return (string) $value['text'];
        }

        return 'Thank you. Infolks Group has received your application and will be in touch if there is news to share.';
    }

    private function subscribe(Candidate $candidate): void
    {
        $member = TalentMember::query()->firstOrNew(['email' => $candidate->email]);
        $member->fill([
            'name' => $candidate->name,
            'phone' => $candidate->phone,
            'candidate_id' => $candidate->id,
            'is_subscribed' => true,
            'unsubscribed_at' => null,
            'privacy_consent_at' => $member->privacy_consent_at ?? now(),
        ]);

        if (! $member->exists) {
            $member->source = TalentSource::QuickApply;
        }

        $member->subscribed_at ??= now();
        $member->save();
    }

    private function queueConfirmation(Application $application, Candidate $candidate, string $department): void
    {
        $confirmation = $this->confirmationText();

        EmailLog::query()->create([
            'type' => EmailType::QuickApplyConfirmation,
            'recipient_email' => $candidate->email,
            'candidate_id' => $candidate->id,
            'application_id' => $application->id,
            'status' => 'queued',
        ]);

        Mail::to($candidate->email)->queue(new QuickApplicationReceived(
            confirmation: $confirmation,
            department: $department,
            careersUrl: rtrim((string) config('app.frontend_careers_url'), '/'),
            recipientEmail: $candidate->email,
        ));
    }
}
