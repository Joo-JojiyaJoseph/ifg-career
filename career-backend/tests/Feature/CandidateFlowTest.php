<?php

use App\Enums\ApplicationSource;
use App\Enums\ApplicationType;
use App\Enums\EmailType;
use App\Enums\TalentSource;
use App\Mail\JobApplicationReceived;
use App\Mail\QuickApplicationReceived;
use App\Models\Application;
use App\Models\Candidate;
use App\Models\Department;
use App\Models\EmailLog;
use App\Models\JobPosting;
use App\Models\TalentMember;
use App\Services\CandidateAuthService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Laravel\Socialite\Contracts\User as SocialiteUser;

function resumeUpload(): UploadedFile
{
    return UploadedFile::fake()->create('resume.pdf', 80, 'application/pdf');
}

function quickApplyPayload(Department $department, array $overrides = []): array
{
    return array_merge([
        'name' => 'Asha Menon',
        'date_of_birth' => '1996-04-12',
        'email' => 'asha@example.com',
        'phone' => '+919876543210',
        'highest_qualification' => 'B.Tech Computer Science',
        'location' => 'Kochi',
        'department_id' => $department->id,
        'resume' => resumeUpload(),
        'keep_updated' => '1',
        'privacy_consent' => '1',
        'company_website' => '',
    ], $overrides);
}

test('quick apply creates a general application and a queued confirmation', function () {
    Storage::fake('private');
    Mail::fake();
    $department = Department::factory()->create(['name' => 'Engineering']);

    $response = $this->post('/api/v1/public/quick-apply', quickApplyPayload($department), [
        'Accept' => 'application/json',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.role', 'General application – Engineering')
        ->assertJsonPath('data.status', 'applied');

    $application = Application::query()->first();
    expect($application->type)->toBe(ApplicationType::General)
        ->and($application->source)->toBe(ApplicationSource::QuickApply)
        ->and($application->snapshot['department_name'])->toBe('Engineering')
        ->and(Candidate::query()->where('email', 'asha@example.com')->exists())->toBeTrue()
        ->and(TalentMember::query()->where('email', 'asha@example.com')->where('source', TalentSource::QuickApply)->where('is_subscribed', true)->exists())->toBeTrue()
        ->and(EmailLog::query()->where('type', EmailType::QuickApplyConfirmation)->where('status', 'queued')->exists())->toBeTrue();

    Mail::assertQueued(QuickApplicationReceived::class);
    Storage::disk('private')->assertExists($application->resume_path);
});

test('quick apply keeps a google profile unchanged and still records the application', function () {
    Storage::fake('private');
    Mail::fake();
    $department = Department::factory()->create();
    Candidate::factory()->create([
        'email' => 'asha@example.com',
        'name' => 'Existing Profile',
        'google_id' => 'google-asha',
        'phone' => '+919800000000',
    ]);

    $this->post('/api/v1/public/quick-apply', quickApplyPayload($department), [
        'Accept' => 'application/json',
    ])->assertCreated()
        ->assertJsonPath('profile_notice', 'You already have a profile. Sign in with Google to update it.');

    expect(Candidate::query()->where('email', 'asha@example.com')->value('name'))->toBe('Existing Profile')
        ->and(Candidate::query()->where('email', 'asha@example.com')->value('phone'))->toBe('+919800000000')
        ->and(Application::query()->count())->toBe(1);
});

test('a honeypot and a failed turnstile check are rejected', function () {
    Storage::fake('private');
    $department = Department::factory()->create();

    $this->post('/api/v1/public/quick-apply', quickApplyPayload($department, [
        'company_website' => 'https://spam.example',
    ]), ['Accept' => 'application/json'])->assertStatus(422);

    expect(Application::query()->count())->toBe(0);

    config(['services.turnstile.secret' => 'test-secret']);
    Http::fake([
        'challenges.cloudflare.com/*' => Http::response(['success' => false], 200),
    ]);

    $this->post('/api/v1/public/talent-community', [
        'name' => 'Asha Menon',
        'email' => 'asha@example.com',
        'phone' => '+919876543210',
        'privacy_consent' => '1',
        'turnstile_token' => 'bad',
    ], ['Accept' => 'application/json'])->assertStatus(422)->assertJsonValidationErrors('turnstile_token');
});

test('talent community signup reports new, existing and returning members', function () {
    $payload = [
        'name' => 'Asha Menon',
        'email' => 'asha@example.com',
        'phone' => '+919876543210',
        'privacy_consent' => '1',
    ];

    $this->postJson('/api/v1/public/talent-community', $payload)
        ->assertOk()
        ->assertJsonPath('code', 'subscribed')
        ->assertJsonPath('message', "You're in! We'll email you about new openings.");

    $this->postJson('/api/v1/public/talent-community', $payload)
        ->assertOk()
        ->assertJsonPath('code', 'already_member');

    TalentMember::query()->where('email', 'asha@example.com')->update([
        'is_subscribed' => false,
        'unsubscribed_at' => now(),
    ]);

    $this->postJson('/api/v1/public/talent-community', $payload)
        ->assertOk()
        ->assertJsonPath('code', 'resubscribed');
});

test('a signed-in candidate can apply, save the profile and receive a confirmation', function () {
    Storage::fake('private');
    Mail::fake();
    $job = JobPosting::factory()->published()->create(['title' => 'Platform Engineer']);
    $job->load('entity');
    $candidate = Candidate::factory()->create(['email' => 'asha@example.com']);

    $this->actingAs($candidate, 'candidate')->post('/api/v1/candidate/jobs/'.$job->public_id.'/apply', [
        'name' => 'Asha Menon',
        'phone' => '+919876543210',
        'location' => 'Kochi, India',
        'gender' => 'female',
        'years_experience' => 3,
        'current_ctc' => 800000,
        'expected_ctc' => 1100000,
        'reference_id' => 'REF-22',
        'linkedin_url' => 'https://www.linkedin.com/in/asha',
        'portfolio_url' => '',
        'save_to_profile' => '1',
        'resume' => resumeUpload(),
        'src' => 'alert',
    ], ['Accept' => 'application/json'])->assertCreated()
        ->assertJsonPath('data.role', 'Platform Engineer');

    $application = Application::query()->first();
    expect($application->source)->toBe(ApplicationSource::Referral)
        ->and($application->snapshot['name'])->toBe('Asha Menon')
        ->and($candidate->fresh()->name)->toBe('Asha Menon')
        ->and(EmailLog::query()->where('type', EmailType::ApplicationConfirmation)->exists())->toBeTrue();

    Mail::assertQueued(JobApplicationReceived::class, function (JobApplicationReceived $mail) use ($job) {
        return $mail->role === 'Platform Engineer' && $mail->entityName === $job->entity->name;
    });

    $candidate->update(['name' => 'Changed Later']);
    expect($application->fresh()->snapshot['name'])->toBe('Asha Menon');
});

test('job alert is the source when no reference id is entered', function () {
    Storage::fake('private');
    Mail::fake();
    $job = JobPosting::factory()->published()->create();
    $candidate = Candidate::factory()->create();

    $this->actingAs($candidate, 'candidate')->post('/api/v1/candidate/jobs/'.$job->public_id.'/apply?src=alert', [
        'name' => 'Asha Menon',
        'phone' => '+919876543210',
        'location' => 'Kochi, India',
        'gender' => 'female',
        'years_experience' => 1,
        'current_ctc' => 0,
        'expected_ctc' => 0,
        'resume' => resumeUpload(),
    ], ['Accept' => 'application/json'])->assertCreated();

    expect(Application::query()->first()->source)->toBe(ApplicationSource::JobAlert);
});

test('a candidate can update a profile, replace a resume and list applications', function () {
    Storage::fake('private');
    $department = Department::factory()->create();
    $candidate = Candidate::factory()->create();
    Storage::disk('private')->put('resumes/original.pdf', 'original');
    $candidate->forceFill([
        'resume_path' => 'resumes/original.pdf',
        'resume_original_name' => 'original.pdf',
    ])->save();

    $this->actingAs($candidate, 'candidate')->putJson('/api/v1/candidate/profile', [
        'name' => 'Asha Menon',
        'date_of_birth' => '1996-04-12',
        'phone' => '+919876543210',
        'location' => 'Kochi, India',
        'gender' => 'female',
        'highest_qualification' => 'B.Tech',
        'preferred_department_id' => $department->id,
        'years_experience' => 4,
        'current_ctc' => 500000,
        'expected_ctc' => 700000,
    ])->assertOk()
        ->assertJsonPath('data.profile_completion_percent', 100)
        ->assertJsonPath('data.profile_completed_at', fn ($value) => filled($value));

    $this->actingAs($candidate, 'candidate')->post('/api/v1/candidate/profile/resume', [
        'resume' => resumeUpload(),
    ], ['Accept' => 'application/json'])->assertOk();

    $this->actingAs($candidate->fresh(), 'candidate')
        ->get('/api/v1/candidate/profile/resume')
        ->assertOk()
        ->assertHeader('X-Content-Type-Options', 'nosniff');

    $other = Candidate::factory()->create();
    $this->actingAs($other, 'candidate')->get('/api/v1/candidate/profile/resume')->assertNotFound();
});

test('my applications use candidate friendly statuses and filters', function () {
    $candidate = Candidate::factory()->create();
    $job = JobPosting::factory()->published()->create();
    $job->load('entity');
    $application = Application::factory()->shortlisted()->create([
        'candidate_id' => $candidate->id,
        'job_posting_id' => $job->id,
    ]);
    \App\Models\InterviewRound::factory()->create(['application_id' => $application->id]);

    $this->actingAs($candidate, 'candidate')
        ->getJson('/api/v1/candidate/applications?status=interview_scheduled&entity='.$job->entity->slug)
        ->assertOk()
        ->assertJsonPath('data.0.status', 'interview_scheduled')
        ->assertJsonPath('data.0.role', $job->title)
        ->assertJsonPath('counts.interview_scheduled', 1)
        ->assertJsonMissingPath('data.0.id');
});

test('subscription can be turned off without a later google sign-in turning it back on', function () {
    $candidate = Candidate::factory()->create([
        'email' => 'asha@example.com',
        'name' => 'Asha Menon',
        'google_id' => 'google-asha',
    ]);
    TalentMember::factory()->create([
        'email' => 'asha@example.com',
        'candidate_id' => $candidate->id,
        'is_subscribed' => true,
    ]);

    $this->actingAs($candidate, 'candidate')->putJson('/api/v1/candidate/subscription', [
        'is_subscribed' => false,
    ])->assertOk()->assertJsonPath('data.talent_subscribed', false);

    $google = new class implements SocialiteUser
    {
        public array $user = ['email_verified' => true];

        public function getId()
        {
            return 'google-asha';
        }

        public function getNickname()
        {
            return null;
        }

        public function getName()
        {
            return 'Different Name';
        }

        public function getEmail()
        {
            return 'asha@example.com';
        }

        public function getAvatar()
        {
            return null;
        }
    };

    app(CandidateAuthService::class)->loginFromGoogle($google);

    expect($candidate->fresh()->name)->toBe('Asha Menon')
        ->and(TalentMember::query()->where('email', 'asha@example.com')->value('is_subscribed'))->toBeFalse();
});

test('confirmation mail uses the Infolks Group header', function () {
    $html = (new JobApplicationReceived(
        role: 'Platform Engineer',
        entityName: 'Webfolks',
        applicationsUrl: 'http://localhost:5173/my-applications',
        recipientEmail: 'asha@example.com',
    ))->render();

    expect($html)->toContain('Infolks Group')
        ->and($html)->toContain('Platform Engineer')
        ->and($html)->toContain('Webfolks')
        ->and($html)->toContain('#1F3A68');
});
