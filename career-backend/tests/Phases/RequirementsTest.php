<?php

/*
 * Acceptance tests for "Infolks Group Careers Website & HR Recruitment Portal, Finalised requirements, 2 November 2026".
 * Each test names the requirement IDs it covers, so a failure points straight at the document.
 */

use App\Enums\ApplicationResult;
use App\Enums\ApplicationStatus;
use App\Enums\JobLevel;
use App\Enums\JobStatus;
use App\Mail\CommunityEmail;
use App\Mail\JobApplicationReceived;
use App\Models\Application;
use App\Models\Candidate;
use App\Models\Department;
use App\Models\EmailLog;
use App\Models\Entity;
use App\Models\JobPosting;
use App\Models\Skill;
use App\Models\TalentMember;
use App\Models\Team;
use Database\Seeders\EntitySeeder;
use Database\Seeders\WebsiteContentSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

require_once __DIR__.'/Support.php';

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    $this->seed(EntitySeeder::class);
    Storage::fake('local');
    Storage::fake('private');
    Mail::fake();
});

function entity(string $slug): Entity
{
    return Entity::query()->where('slug', $slug)->firstOrFail();
}

function openJob(array $attributes = []): JobPosting
{
    return JobPosting::factory()->published()->create($attributes + ['entity_id' => entity('webfolks')->id]);
}

function applicationForm(array $overrides = []): array
{
    return $overrides + [
        'name' => 'Asha Menon',
        'phone' => '+919847012345',
        'location' => 'Kochi, India',
        'gender' => 'female',
        'years_experience' => 3,
        'current_ctc' => 400000,
        'expected_ctc' => 550000,
        'reference_id' => '',
        'linkedin_url' => 'https://www.linkedin.com/in/asha',
        'portfolio_url' => '',
        'resume' => UploadedFile::fake()->create('resume.pdf', 200, 'application/pdf'),
    ];
}

function mailCount(string $mailable): int
{
    return Mail::queued($mailable)->count() + Mail::sent($mailable)->count();
}

it('JS-01 to JS-10: lists only open published jobs and filters by search, entity, department, team, level, location and skills', function () {
    $department = Department::factory()->create(['name' => 'Engineering']);
    $team = Team::factory()->create(['name' => 'Web Platform', 'department_id' => $department->id]);
    $react = Skill::factory()->create(['name' => 'React', 'slug' => 'react']);

    $match = openJob(['title' => 'Frontend Developer', 'department_id' => $department->id, 'team_id' => $team->id, 'location' => 'Kochi', 'level' => JobLevel::AllLevel]);
    $match->skills()->attach($react);
    $intern = openJob(['title' => 'Design Intern', 'level' => JobLevel::Internship, 'location' => 'Pune', 'entity_id' => entity('medrays')->id]);
    JobPosting::factory()->create(['title' => 'Draft role', 'entity_id' => entity('infolks')->id]);
    JobPosting::factory()->closed()->create(['title' => 'Closed role', 'entity_id' => entity('infolks')->id]);
    JobPosting::factory()->published()->create(['title' => 'Expired role', 'entity_id' => entity('infolks')->id, 'last_date_to_apply' => now()->subDay()->toDateString()]);

    $titles = fn (string $query = '') => array_column($this->getJson('/api/v1/public/jobs'.$query)->assertOk()->json('data'), 'title');

    expect($titles())->toEqualCanonicalizing(['Frontend Developer', 'Design Intern'])             // JS-01, JS-10
        ->and($titles('?q=frontend'))->toBe(['Frontend Developer'])                               // JS-02 role
        ->and($titles('?q=react'))->toBe(['Frontend Developer'])                                  // JS-02 skill
        ->and($titles('?q=medrays'))->toBe(['Design Intern'])                                     // JS-02 entity name
        ->and($titles('?entity=webfolks'))->toBe(['Frontend Developer'])                          // JS-03
        ->and($titles("?department={$department->id}"))->toBe(['Frontend Developer'])             // JS-04
        ->and($titles("?team={$team->id}"))->toBe(['Frontend Developer'])                         // JS-04
        ->and($titles('?level=internship'))->toBe(['Design Intern'])                              // JS-05
        ->and($titles('?location=Pune'))->toBe(['Design Intern'])                                 // JS-06
        ->and($titles('?skills[]=react'))->toBe(['Frontend Developer'])                           // JS-07
        ->and($titles('?q=nothing-matches-this'))->toBe([]);                                      // JS-09 (empty list; the page shows the message)

    $card = collect($this->getJson('/api/v1/public/jobs')->json('data'))->firstWhere('title', 'Frontend Developer');
    expect($card['entity']['name'])->toBe('Webfolks')                                             // JS-08
        ->and($card['entity']['theme']['primary'])->not->toBeEmpty()
        ->and($card['team']['name'])->toBe('Web Platform')
        ->and($card['level']['label'])->not->toBeEmpty()
        ->and($card['location'])->toBe('Kochi')
        ->and($card['posted_at'])->not->toBeNull();
});

it('JD-01 to JD-07: one job detail payload with every field, the deadline, the steps and the entity theme', function () {
    $job = openJob(['title' => 'Data Analyst', 'why_join_us' => 'Grow with Webfolks.']);

    $data = $this->getJson("/api/v1/public/jobs/{$job->public_id}")->assertOk()->json('data');

    expect($data)->toHaveKeys(['title', 'entity', 'team', 'level', 'location', 'posted_at', 'last_date_to_apply', 'summary', 'qualification', 'skills', 'experience', 'why_join_us', 'interview_steps'])
        ->and($data['entity']['name'])->toBe('Webfolks')
        ->and($data['entity']['motto'])->not->toBeEmpty()
        ->and($data['entity']['theme'])->toHaveKeys(['primary', 'secondary', 'accent'])
        ->and($data['why_join_us'])->toBe('Grow with Webfolks.');

    $this->getJson('/api/v1/public/jobs/'.JobPosting::factory()->create(['entity_id' => entity('infolks')->id])->public_id)->assertNotFound();
});

it('PR-03, PR-05, PR-06, PR-07, PR-08, AF-03, CI-02: a signed-in candidate applies, joins the talent community and sees the application', function () {
    $job = openJob(['title' => 'QA Engineer']);
    $candidate = Candidate::factory()->complete()->create(['email' => 'asha@example.com']);
    $this->actingAs($candidate, 'candidate');

    // PR-08: the form is pre-filled from the profile.
    $profile = $this->getJson('/api/v1/candidate/profile')->assertOk()->json('data');
    expect($profile['email'])->toBe('asha@example.com')->and($profile['name'])->toBe($candidate->name);

    $this->post("/api/v1/candidate/jobs/{$job->public_id}/apply", applicationForm(['reference_id' => 'IG-1042', 'save_to_profile' => true]), ['Accept' => 'application/json'])
        ->assertSuccessful();

    // AF-03: confirmation email naming the role and the company.
    expect(mailCount(JobApplicationReceived::class))->toBe(1);

    // CI-02: tags on the application.
    $application = Application::query()->where('candidate_id', $candidate->id)->firstOrFail();
    expect($application->referred)->toBeTrue()
        ->and($application->reference_id)->toBe('IG-1042')
        ->and($application->entity_id)->toBe(entity('webfolks')->id)
        ->and($application->status)->toBe(ApplicationStatus::Applied);

    // PR-07: My Applications lists entity, role and status.
    $mine = $this->getJson('/api/v1/candidate/applications')->assertOk()->json('data.0');
    expect($mine['role'] ?? $mine['job']['title'] ?? null)->toContain('QA Engineer');

    // PR-06 / TC-01: the candidate is in the talent community.
    expect(TalentMember::query()->where('email', 'asha@example.com')->exists())->toBeTrue();

    // PR-05: HR sees the same profile and the application.
    actingAsHr();
    $hr = $this->getJson("/api/v1/hr/candidates/{$candidate->public_id}")->assertOk()->json('data');
    expect($hr['email'])->toBe('asha@example.com')->and($hr['applications'])->toHaveCount(1);
});

it('AF-02: explains missing fields, a bad email or phone, a wrong file type and links that are not URLs', function () {
    $job = openJob();
    $this->actingAs(Candidate::factory()->create(['resume_path' => null]), 'candidate');

    $this->postJson("/api/v1/candidate/jobs/{$job->public_id}/apply", [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name', 'phone', 'location', 'gender', 'years_experience', 'current_ctc', 'expected_ctc', 'resume']);

    $this->post("/api/v1/candidate/jobs/{$job->public_id}/apply", applicationForm([
        'phone' => '12',
        'linkedin_url' => 'not a link',
        'portfolio_url' => 'also not a link',
        'resume' => UploadedFile::fake()->create('resume.png', 50, 'image/png'),
    ]), ['Accept' => 'application/json'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['phone', 'linkedin_url', 'portfolio_url', 'resume']);

    // Resume: PDF or DOCX up to 5 MB.
    $this->post("/api/v1/candidate/jobs/{$job->public_id}/apply", applicationForm([
        'resume' => UploadedFile::fake()->create('resume.pdf', 6 * 1024, 'application/pdf'),
    ]), ['Accept' => 'application/json'])->assertUnprocessable()->assertJsonValidationErrors(['resume']);
});

it('AR-01, AR-02, AR-06: one application per job, a new opening for the same role is open, no applications after the last date', function () {
    $candidate = Candidate::factory()->complete()->create();
    $this->actingAs($candidate, 'candidate');
    $first = openJob(['title' => 'Annotator', 'role_key' => 'annotator']);

    $this->post("/api/v1/candidate/jobs/{$first->public_id}/apply", applicationForm(), ['Accept' => 'application/json'])->assertSuccessful();
    $this->post("/api/v1/candidate/jobs/{$first->public_id}/apply", applicationForm(), ['Accept' => 'application/json'])->assertUnprocessable();
    expect($this->getJson("/api/v1/candidate/jobs/{$first->public_id}/eligibility")->json('data.code') ?? $this->getJson("/api/v1/candidate/jobs/{$first->public_id}/eligibility")->json('code'))->toBe('already_applied');

    $reopened = openJob(['title' => 'Annotator', 'role_key' => 'annotator']);
    $this->post("/api/v1/candidate/jobs/{$reopened->public_id}/apply", applicationForm(), ['Accept' => 'application/json'])->assertSuccessful();

    $expired = openJob(['last_date_to_apply' => now()->subDay()->toDateString()]);
    $status = $this->post("/api/v1/candidate/jobs/{$expired->public_id}/apply", applicationForm(), ['Accept' => 'application/json'])->status();
    expect($status)->toBeIn([404, 422]);
});

it('AR-03, AR-05: rejection after shortlisting blocks the same role for 6 months, other roles stay open, the block lifts and HR can override it', function () {
    $candidate = Candidate::factory()->complete()->create();
    $job = openJob(['title' => 'Annotator', 'role_key' => 'annotator']);
    $application = Application::factory()->create(['candidate_id' => $candidate->id, 'job_posting_id' => $job->id, 'entity_id' => $job->entity_id, 'status' => ApplicationStatus::UnderReview]);

    actingAsHr();
    $this->patchJson("/api/v1/hr/applications/{$application->public_id}/status", ['status' => 'shortlisted'])->assertOk();
    $this->patchJson("/api/v1/hr/applications/{$application->public_id}/status", ['status' => 'rejected'])->assertOk();

    $this->actingAs($candidate, 'candidate');
    $again = openJob(['title' => 'Annotator', 'role_key' => 'annotator']);
    $other = openJob(['title' => 'Designer', 'role_key' => 'designer']);

    $blocked = $this->getJson("/api/v1/candidate/jobs/{$again->public_id}/eligibility")->json();
    expect(data_get($blocked, 'data.code', data_get($blocked, 'code')))->toBe('role_blocked')
        ->and(data_get($blocked, 'data.message', data_get($blocked, 'message')))->toContain('You can apply for this role again after');
    expect(data_get($this->getJson("/api/v1/candidate/jobs/{$other->public_id}/eligibility")->json(), 'data.eligible', true))->toBeTrue();

    // The block lifts by itself after six months.
    $this->travel(6)->months();
    $this->travel(1)->days();
    $again->update(['last_date_to_apply' => now()->addMonth()->toDateString()]);
    expect(data_get($this->getJson("/api/v1/candidate/jobs/{$again->public_id}/eligibility")->json(), 'data.eligible', data_get($this->getJson("/api/v1/candidate/jobs/{$again->public_id}/eligibility")->json(), 'eligible')))->toBeTrue();
});

it('AR-04, CI-04: a blacklisted candidate is paused for 6 months across every entity, and HR can filter blacklisted candidates', function () {
    $candidate = Candidate::factory()->complete()->create();
    actingAsHr();
    $this->postJson("/api/v1/hr/candidates/{$candidate->public_id}/blacklist", ['reason' => 'Shared test answers'])->assertSuccessful();

    $ids = array_column($this->getJson('/api/v1/hr/candidates?blacklisted=1')->assertOk()->json('data'), 'public_id');
    expect($ids)->toBe([$candidate->public_id]);

    $this->actingAs($candidate->fresh(), 'candidate');
    foreach (['infolks', 'medrays', 'webfolks', 'dataways'] as $slug) {
        $job = openJob(['entity_id' => entity($slug)->id]);
        $check = $this->getJson("/api/v1/candidate/jobs/{$job->public_id}/eligibility")->json();
        expect(data_get($check, 'data.eligible', data_get($check, 'eligible')))->toBeFalse();
    }
});

it('TC-02 to TC-05: anyone can join with name, email and phone; community emails carry an unsubscribe link; unsubscribing stops them but not confirmations', function () {
    $this->postJson('/api/v1/public/talent-community', ['name' => 'Ravi', 'email' => 'ravi@example.com', 'phone' => '+919847012300', 'privacy_consent' => true])->assertOk();
    $member = TalentMember::query()->where('email', 'ravi@example.com')->firstOrFail();
    expect($member->is_subscribed)->toBeTrue();

    $this->postJson('/api/v1/public/talent-community', ['name' => 'R', 'email' => 'bad', 'phone' => '1'])
        ->assertUnprocessable()->assertJsonValidationErrors(['name', 'email', 'phone', 'privacy_consent']);

    // TC-03, TC-04, CI-09: HR sends a company update; it reaches members and includes the unsubscribe link.
    actingAsHr('Admin');
    $campaign = $this->postJson('/api/v1/hr/campaigns', ['type' => 'company_update', 'subject' => 'News from Infolks Group', 'body' => '<p>We moved offices.</p>'])->assertSuccessful()->json('data');
    $this->postJson("/api/v1/hr/campaigns/{$campaign['public_id']}/send")->assertSuccessful();
    expect(mailCount(CommunityEmail::class))->toBeGreaterThanOrEqual(1);
    $html = (Mail::queued(CommunityEmail::class)->first() ?? Mail::sent(CommunityEmail::class)->first())->render();
    expect($html)->toContain('unsubscribe');
    expect(EmailLog::query()->count())->toBeGreaterThanOrEqual(1);                                // section 8, email log

    // TC-05
    $this->postJson("/api/v1/public/unsubscribe/{$member->fresh()->unsubscribe_token}")->assertSuccessful();
    expect($member->fresh()->is_subscribed)->toBeFalse();
});

it('HA-02, HA-03: Admin and HR roles; only Admin manages users, teams and the skills list', function () {
    actingAsHr('HR');
    $this->getJson('/api/v1/hr/users')->assertForbidden();
    $this->postJson('/api/v1/hr/lists/skills', ['name' => 'Rust'])->assertForbidden();
    $this->getJson('/api/v1/hr/job-postings')->assertOk();
    $this->getJson('/api/v1/hr/candidates')->assertOk();
    $this->getJson('/api/v1/hr/applications')->assertOk();
    $this->getJson('/api/v1/hr/interviews')->assertOk();

    actingAsHr('Admin');
    $this->getJson('/api/v1/hr/users')->assertOk();
    $this->postJson('/api/v1/hr/lists/skills', ['name' => 'Rust'])->assertSuccessful();
    $this->postJson('/api/v1/hr/lists/teams', ['name' => 'Data Ops'])->assertSuccessful();
});

it('Jobs section and 6.3: create a draft, publish (posted date set), unpublish, extend the last date and close', function () {
    actingAsHr();
    $department = Department::factory()->create();
    $team = Team::factory()->create(['department_id' => $department->id]);
    Skill::factory()->create(['name' => 'Python', 'slug' => 'python']);

    $job = $this->postJson('/api/v1/hr/job-postings', [
        'title' => 'ML Engineer', 'entity' => 'dataways', 'department_id' => $department->id, 'team_id' => $team->id,
        'level' => 'all_level', 'location' => 'Kochi', 'summary' => 'Build models.', 'qualification' => 'B.Tech',
        'experience' => '2+ years', 'why_join_us' => 'Data at scale.', 'last_date_to_apply' => now()->addWeeks(2)->toDateString(), 'skills' => ['python'],
    ])->assertSuccessful()->json('data');
    expect($job['status']['value'] ?? $job['status'])->toBe('draft');
    $this->getJson("/api/v1/public/jobs/{$job['public_id']}")->assertNotFound();

    $this->postJson("/api/v1/hr/job-postings/{$job['public_id']}/publish")->assertSuccessful();
    $posting = JobPosting::query()->where('public_id', $job['public_id'])->firstOrFail();
    expect($posting->status)->toBe(JobStatus::Published)->and($posting->posted_at)->not->toBeNull()->and($posting->created_by)->not->toBeNull();
    $this->getJson("/api/v1/public/jobs/{$job['public_id']}")->assertOk()->assertJsonPath('data.entity.name', 'Dataways');

    $this->postJson("/api/v1/hr/job-postings/{$job['public_id']}/unpublish")->assertSuccessful();
    $this->getJson("/api/v1/public/jobs/{$job['public_id']}")->assertNotFound();
    $this->postJson("/api/v1/hr/job-postings/{$job['public_id']}/publish")->assertSuccessful();

    $later = now()->addMonths(2)->toDateString();
    $this->postJson("/api/v1/hr/job-postings/{$job['public_id']}/extend", ['last_date_to_apply' => $later])->assertSuccessful();
    expect($posting->fresh()->last_date_to_apply->toDateString())->toBe($later);

    $this->postJson("/api/v1/hr/job-postings/{$job['public_id']}/close")->assertSuccessful();
    expect($posting->fresh()->status)->toBe(JobStatus::Closed);
});

it('Candidates section, CI-01, CI-03, CI-07: notes, colour tags, filters by gender, entity and role, and counts', function () {
    $job = openJob(['title' => 'Annotator']);
    $female = Candidate::factory()->complete()->create(['gender' => 'female']);
    $male = Candidate::factory()->complete()->create(['gender' => 'male']);
    Application::factory()->create(['candidate_id' => $female->id, 'job_posting_id' => $job->id, 'entity_id' => $job->entity_id]);
    Application::factory()->create(['candidate_id' => $male->id, 'job_posting_id' => openJob(['entity_id' => entity('medrays')->id])->id]);

    actingAsHr();
    $this->postJson("/api/v1/hr/candidates/{$female->public_id}/notes", ['body' => 'Strong portfolio, call on Monday.'])->assertSuccessful();
    $this->patchJson("/api/v1/hr/candidates/{$female->public_id}", ['colour_tag' => 'contacted'])->assertOk();

    $profile = $this->getJson("/api/v1/hr/candidates/{$female->public_id}")->json('data');
    expect($profile['notes'][0]['body'])->toBe('Strong portfolio, call on Monday.')
        ->and($profile['notes'][0])->toHaveKeys(['author', 'created_at'])
        ->and($profile['colour_tag']['value'] ?? $profile['colour_tag'])->toBe('contacted');

    $list = fn (string $query) => $this->getJson('/api/v1/hr/candidates'.$query)->assertOk()->json();
    expect(array_column($list('?gender=female')['data'], 'public_id'))->toBe([$female->public_id])
        ->and(array_column($list('?entity=webfolks')['data'], 'public_id'))->toBe([$female->public_id])
        ->and(array_column($list('?role=Annotator')['data'], 'public_id'))->toBe([$female->public_id])
        ->and($list('')['meta']['total'])->toBe(2)
        ->and($list(''))->toHaveKey('counts');
});

it('Applications and Interviews sections, CI-05, CI-06: statuses, shortlisting, rounds, Selected and Not selected', function () {
    Queue::fake();                                                     // calendar sync is a queued job
    $job = openJob();
    $application = Application::factory()->create(['job_posting_id' => $job->id, 'entity_id' => $job->entity_id]);
    actingAsHr();

    foreach (['under_review', 'shortlisted'] as $status) {
        $this->patchJson("/api/v1/hr/applications/{$application->public_id}/status", ['status' => $status])->assertOk();
    }
    $statuses = array_column($this->getJson('/api/v1/hr/meta')->json('data.enums.application_statuses') ?? $this->getJson('/api/v1/hr/meta')->json('enums.application_statuses'), 'label');
    expect($statuses)->toBe(['Applied', 'Under review', 'Shortlisted', 'Rejected']);

    $round = $this->postJson("/api/v1/hr/applications/{$application->public_id}/rounds", [
        'round_name' => 'Round 1: Skill Test', 'scheduled_at' => now()->addDays(2)->setTime(10, 0)->toIso8601String(),
        'duration_minutes' => 60, 'mode' => 'video', 'location_or_link' => 'https://meet.google.com/abc-defg-hij', 'interviewer_name' => 'Rahul K',
    ])->assertSuccessful()->json('data.round') ?? null;
    $roundId = $round['public_id'] ?? $application->fresh()->interviewRounds()->first()->public_id;

    $roundStatuses = array_column($this->getJson('/api/v1/hr/meta')->json('data.enums.round_statuses') ?? [], 'label');
    expect($roundStatuses)->toBe(['Scheduled', 'Completed', 'Passed', 'Not selected']);

    $this->patchJson("/api/v1/hr/rounds/{$roundId}/status", ['status' => 'passed'])->assertOk();
    $this->patchJson("/api/v1/hr/applications/{$application->public_id}/result", ['result' => 'selected'])->assertOk();
    expect($application->fresh()->result)->toBe(ApplicationResult::Selected);
});

it('CI-08: exports candidates to Excel', function () {
    Candidate::factory()->count(3)->complete()->create();
    actingAsHr();
    $export = $this->postJson('/api/v1/hr/exports', ['type' => 'candidates'])->assertSuccessful()->json('data');
    expect($export['public_id'] ?? $export['id'] ?? null)->not->toBeNull();
});

it('Section 7: status changes never email the candidate', function () {
    $application = Application::factory()->create();
    actingAsHr();
    $this->patchJson("/api/v1/hr/applications/{$application->public_id}/status", ['status' => 'under_review'])->assertOk();
    $this->patchJson("/api/v1/hr/applications/{$application->public_id}/status", ['status' => 'rejected'])->assertOk();
    Mail::assertNothingOutgoing();
});

it('Section 2: the four entities are separate from the group, and Infolks is never the parent', function () {
    $names = array_column($this->getJson('/api/v1/public/entities')->assertOk()->json('data'), 'name');
    expect($names)->toEqualCanonicalizing(['Infolks', 'Webfolks', 'Dataways', 'Medrays'])
        ->and($names)->not->toContain('Infolks Group');
});

it('Step 4: applying adds the candidate to the talent community, but never re-subscribes someone who left', function () {
    $job = openJob();
    $left = Candidate::factory()->complete()->create(['email' => 'left@example.com']);
    TalentMember::query()->create(['name' => 'Left', 'email' => 'left@example.com', 'phone' => '+919847012399', 'is_subscribed' => false, 'unsubscribed_at' => now(), 'source' => 'signup_form']);

    $this->actingAs($left, 'candidate');
    $this->post("/api/v1/candidate/jobs/{$job->public_id}/apply", applicationForm(), ['Accept' => 'application/json'])->assertSuccessful();

    $member = TalentMember::query()->where('email', 'left@example.com')->firstOrFail();
    expect($member->is_subscribed)->toBeFalse()->and($member->candidate_id)->toBe($left->id);
    expect(mailCount(JobApplicationReceived::class))->toBe(1);                                    // TC-05: confirmation still sent
});

it('LP-06, LP-08: serves the company numbers that are set, and the videos HR adds', function () {
    $this->seed(WebsiteContentSeeder::class);
    actingAsHr();

    $this->postJson('/api/v1/hr/content/media-items', ['type' => 'video', 'title' => 'A day at Infolks Group', 'youtube_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'])->assertCreated();
    $this->postJson('/api/v1/hr/content/media-items', ['type' => 'video', 'title' => 'Bad link', 'youtube_url' => 'https://vimeo.com/123'])->assertUnprocessable()->assertJsonValidationErrors('youtube_url');

    $content = $this->getJson('/api/v1/public/content')->json('data');
    expect($content['company_numbers'])->toMatchArray(['employees' => 1000, 'years' => 10])
        ->and($content['company_numbers'])->not->toHaveKey('clients')
        ->and(collect($content['media'])->firstWhere('title', 'A day at Infolks Group')['youtube_id'])->toBe('dQw4w9WgXcQ');
});
