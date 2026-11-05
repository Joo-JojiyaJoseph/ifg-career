<?php

use App\Enums\JobStatus;
use App\Models\Application;
use App\Models\Candidate;
use App\Models\Department;
use App\Models\Entity;
use App\Models\JobPosting;
use App\Models\RoleBlock;
use App\Models\SavedFilter;
use App\Models\Skill;
use App\Models\User;
use App\Services\ApplicationEligibilityService;
use Database\Seeders\HrUserSeeder;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Support\Facades\URL;

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    $this->seed(HrUserSeeder::class);
});

function loginHr(): void
{
    portalJson('POST', '/api/v1/hr/login', [
        'email' => 'hr@infolksgroup.com',
        'password' => HrUserSeeder::PASSWORD,
    ])->assertOk();
}

test('the public list shows open roles only and returns facet counts', function () {
    $alpha = Entity::factory()->create(['slug' => 'alpha-co', 'name' => 'Alpha Co']);
    $beta = Entity::factory()->create(['slug' => 'beta-co', 'name' => 'Beta Co']);
    $skill = Skill::factory()->create(['name' => 'Pest Skill', 'slug' => 'pest-skill']);

    $first = JobPosting::factory()->published()->create([
        'entity_id' => $alpha->id,
        'title' => 'UniqueKeyboardRole',
        'location' => 'Kochi',
    ]);
    $first->skills()->sync([$skill->id]);

    JobPosting::factory()->published()->create([
        'entity_id' => $alpha->id,
        'location' => 'Bengaluru',
    ]);
    JobPosting::factory()->published()->create([
        'entity_id' => $beta->id,
        'location' => 'Kochi',
    ]);
    JobPosting::factory()->create(['entity_id' => $alpha->id, 'status' => JobStatus::Draft]);
    JobPosting::factory()->published()->create([
        'entity_id' => $beta->id,
        'last_date_to_apply' => now()->subDay()->toDateString(),
    ]);

    $list = $this->getJson('/api/v1/public/jobs')->assertOk();

    expect($list->json('meta.total'))->toBe(3)
        ->and($list->json('counts.entity.alpha-co'))->toBe(2)
        ->and($list->json('counts.entity.beta-co'))->toBe(1)
        ->and($list->json('data.0.public_id'))->not->toBeNull()
        ->and($list->json('data.0'))->not->toHaveKey('id');

    $byEntity = $this->getJson('/api/v1/public/jobs?entity=alpha-co')->assertOk();
    expect($byEntity->json('meta.total'))->toBe(2)
        ->and($byEntity->json('counts.entity.beta-co'))->toBe(1);

    $filtered = $this->getJson('/api/v1/public/jobs?entity=alpha-co&q=UniqueKeyboard')->assertOk();
    expect($filtered->json('meta.total'))->toBe(1)
        ->and($filtered->json('data.0.title'))->toBe('UniqueKeyboardRole')
        ->and($filtered->json('counts.skill.pest-skill'))->toBe(1);
});

test('a draft role is hidden unless the preview link is signed', function () {
    $job = JobPosting::factory()->create(['status' => JobStatus::Draft, 'title' => 'Hidden draft']);

    $this->getJson('/api/v1/public/jobs/'.$job->public_id)->assertNotFound();

    $url = URL::temporarySignedRoute('public.jobs.show', now()->addHour(), ['jobPosting' => $job->public_id]);
    $this->getJson($url)->assertOk()->assertJsonPath('data.title', 'Hidden draft');
});

test('hr can draft, publish, duplicate and extend a role', function () {
    loginHr();
    $entity = Entity::factory()->create(['slug' => 'webfolks-jobs']);
    $department = Department::factory()->create();
    $skill = Skill::factory()->create(['slug' => 'laravel-skill']);

    $created = portalJson('POST', '/api/v1/hr/job-postings', [
        'title' => 'Platform engineer',
        'entity' => $entity->slug,
        'department_id' => $department->id,
        'level' => 'all_level',
        'location' => 'Kochi',
        'summary' => 'Build the careers platform.',
        'qualification' => 'A degree or equivalent experience.',
        'experience' => '2 years',
        'last_date_to_apply' => now()->addMonth()->toDateString(),
        'skills' => [$skill->slug],
    ])->assertCreated();

    $id = $created->json('data.public_id');
    expect($created->json('data.status'))->toBe('draft')
        ->and($created->json('data.role_key'))->toBe('platform engineer');

    portalJson('POST', '/api/v1/hr/job-postings/'.$id.'/publish')->assertOk()
        ->assertJsonPath('data.status', 'published');

    $copy = portalJson('POST', '/api/v1/hr/job-postings/'.$id.'/duplicate')->assertCreated();
    expect($copy->json('data.role_key'))->toBe('platform engineer')
        ->and($copy->json('data.status'))->toBe('draft')
        ->and($copy->json('data.title'))->toContain('(copy)');

    portalJson('POST', '/api/v1/hr/job-postings/'.$id.'/close')->assertOk()
        ->assertJsonPath('data.status', 'closed');

    $extended = now()->addWeeks(2)->toDateString();
    portalJson('POST', '/api/v1/hr/job-postings/'.$id.'/extend', [
        'last_date_to_apply' => $extended,
    ])->assertOk()
        ->assertJsonPath('data.status', 'published')
        ->assertJsonPath('data.last_date_to_apply', $extended);

    $this->getJson('/api/v1/public/jobs/'.$id)->assertOk()->assertJsonPath('data.entity.slug', 'webfolks-jobs');
});

test('publish rejects an incomplete draft and bulk close updates the rest', function () {
    loginHr();
    $entity = Entity::factory()->create();
    $incomplete = portalJson('POST', '/api/v1/hr/job-postings', [
        'title' => 'Needs detail',
        'entity' => $entity->slug,
        'level' => 'all_level',
        'location' => 'Kochi',
        'summary' => 'A draft summary.',
        'qualification' => 'A degree.',
        'experience' => '1 year',
        'last_date_to_apply' => now()->addWeek()->toDateString(),
    ])->assertCreated()->json('data.public_id');

    portalJson('POST', '/api/v1/hr/job-postings/'.$incomplete.'/publish')->assertStatus(422);

    $ready = JobPosting::factory()->published()->create(['entity_id' => $entity->id]);
    portalJson('POST', '/api/v1/hr/job-postings/bulk', [
        'action' => 'close',
        'ids' => [$ready->public_id, $incomplete],
    ])->assertOk()->assertJsonPath('data.updated', 2);

    expect(JobPosting::query()->find($ready->id)->status)->toBe(JobStatus::Closed);
});

test('a role with applications cannot be deleted', function () {
    loginHr();
    $job = JobPosting::factory()->published()->create();
    Application::factory()->create([
        'job_posting_id' => $job->id,
        'candidate_id' => Candidate::factory(),
    ]);

    portalJson('DELETE', '/api/v1/hr/job-postings/'.$job->public_id)->assertStatus(422);
    expect(JobPosting::query()->find($job->id))->not->toBeNull();
});

test('saved filters can be the default and shared with another hr user', function () {
    loginHr();
    $created = portalJson('POST', '/api/v1/hr/saved-filters', [
        'screen' => 'jobs',
        'name' => 'Kochi drafts',
        'query' => ['location' => 'Kochi', 'status' => 'draft'],
        'is_default' => true,
        'is_shared' => true,
    ])->assertCreated();

    expect($created->json('data.is_default'))->toBeTrue();

    $other = User::factory()->create([
        'password' => HrUserSeeder::PASSWORD,
    ]);
    $other->assignRole('HR');

    portalJson('POST', '/api/v1/hr/logout')->assertOk();
    portalJson('POST', '/api/v1/hr/login', [
        'email' => $other->email,
        'password' => HrUserSeeder::PASSWORD,
    ])->assertOk();

    portalJson('GET', '/api/v1/hr/saved-filters?screen=jobs')
        ->assertOk()
        ->assertJsonPath('data.0.name', 'Kochi drafts');

    expect(SavedFilter::query()->where('name', 'Kochi drafts')->count())->toBe(1);
});

test('eligibility explains a role block and a second application', function () {
    $job = JobPosting::factory()->published()->create(['role_key' => 'platform engineer']);
    $candidate = Candidate::factory()->create();
    $service = app(ApplicationEligibilityService::class);

    expect($service->forJob($candidate, $job)['eligible'])->toBeTrue();

    RoleBlock::query()->create([
        'candidate_id' => $candidate->id,
        'role_key' => $job->role_key,
        'blocked_until' => now()->addMonths(6),
        'reason' => 'Rejected after shortlisting',
    ]);

    $blocked = $service->forJob($candidate, $job->fresh());
    expect($blocked['eligible'])->toBeFalse()->and($blocked['code'])->toBe('role_blocked');

    RoleBlock::query()->delete();
    Application::factory()->create([
        'job_posting_id' => $job->id,
        'candidate_id' => $candidate->id,
    ]);

    expect($service->forJob($candidate->fresh(), $job)['code'])->toBe('already_applied');
});
