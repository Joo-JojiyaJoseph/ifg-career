<?php

use App\Enums\ApplicationResult;
use App\Enums\ApplicationStatus;
use App\Enums\JobStatus;
use App\Models\Application;
use App\Models\Candidate;
use App\Models\JobPosting;
use App\Models\RoleBlock;
use App\Services\ApplicationEligibilityService;
use Illuminate\Database\QueryException;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Route;

function eligibility(): ApplicationEligibilityService
{
    return app(ApplicationEligibilityService::class);
}

test('AR-01 a candidate can apply to a job only once', function () {
    $job = JobPosting::factory()->published()->create();
    $candidate = Candidate::factory()->create();

    expect(eligibility()->forJob($candidate, $job)['code'])->toBeNull();

    Application::factory()->create([
        'candidate_id' => $candidate->id,
        'job_posting_id' => $job->id,
    ]);

    $result = eligibility()->forJob($candidate->fresh(), $job);

    expect($result['eligible'])->toBeFalse()
        ->and($result['code'])->toBe('already_applied')
        ->and($result['message'])->toBe('You have already applied for this role.');

    expect(fn () => Application::factory()->create([
        'candidate_id' => $candidate->id,
        'job_posting_id' => $job->id,
    ]))->toThrow(QueryException::class);
});

test('AR-02 a new job with the same role key can be applied to', function () {
    $candidate = Candidate::factory()->create();
    $first = JobPosting::factory()->published()->create(['role_key' => 'platform engineer']);
    $second = JobPosting::factory()->published()->create(['role_key' => 'platform engineer']);

    Application::factory()->create([
        'candidate_id' => $candidate->id,
        'job_posting_id' => $first->id,
    ]);

    expect(eligibility()->forJob($candidate, $first->fresh())['code'])->toBe('already_applied')
        ->and(eligibility()->forJob($candidate, $second->fresh())['eligible'])->toBeTrue();
});

test('AR-03 rejection after shortlisting blocks that role key for six months', function () {
    Mail::fake();
    $candidate = Candidate::factory()->create();
    $job = JobPosting::factory()->published()->create(['role_key' => 'data analyst']);
    $other = JobPosting::factory()->published()->create(['role_key' => 'nurse']);
    $application = Application::factory()->shortlisted()->create([
        'candidate_id' => $candidate->id,
        'job_posting_id' => $job->id,
    ]);

    $application->update(['status' => ApplicationStatus::Rejected]);

    $block = RoleBlock::query()->where('candidate_id', $candidate->id)->where('role_key', 'data analyst')->first();

    expect($block)->not->toBeNull()
        ->and($block->blocked_until->greaterThan(now()->addMonths(5)))->toBeTrue()
        ->and($block->reason)->toBe('Rejected after shortlisting');

    $sameRole = JobPosting::factory()->published()->create(['role_key' => 'data analyst']);
    $blocked = eligibility()->forJob($candidate->fresh(), $sameRole);

    expect($blocked['code'])->toBe('role_blocked')
        ->and($blocked['until'])->toBe($block->blocked_until->toDateString())
        ->and($blocked['message'])->toContain('You can apply for this role again after')
        ->and(eligibility()->forJob($candidate->fresh(), $job->fresh())['code'])->toBe('already_applied')
        ->and(eligibility()->forJob($candidate->fresh(), $other)['eligible'])->toBeTrue();

    Mail::assertNothingOutgoing();
});

test('AR-03 a not selected result blocks that role key', function () {
    Mail::fake();
    $candidate = Candidate::factory()->create();
    $job = JobPosting::factory()->published()->create(['role_key' => 'pharmacist']);
    $application = Application::factory()->shortlisted()->create([
        'candidate_id' => $candidate->id,
        'job_posting_id' => $job->id,
    ]);

    $application->update(['result' => ApplicationResult::NotSelected]);
    $reopening = JobPosting::factory()->published()->create(['role_key' => 'pharmacist']);

    expect(RoleBlock::query()->where('role_key', 'pharmacist')->where('reason', 'Not selected')->exists())->toBeTrue()
        ->and(eligibility()->forJob($candidate->fresh(), $reopening)['code'])->toBe('role_blocked');

    Mail::assertNothingOutgoing();
});

test('AR-04 a blacklisted candidate cannot apply to a job or a general application', function () {
    $candidate = Candidate::factory()->blacklisted()->create();
    $job = JobPosting::factory()->published()->create();
    $otherEntity = JobPosting::factory()->published()->create();
    $departmentId = $job->department_id ?? \App\Models\Department::factory()->create()->id;

    $jobResult = eligibility()->forJob($candidate->fresh(), $job);
    $general = eligibility()->forGeneral($candidate->fresh(), $departmentId);

    expect($jobResult['code'])->toBe('blacklisted')
        ->and($jobResult['until'])->not->toBeNull()
        ->and($jobResult['message'])->toContain('Applications from this profile are paused until')
        ->and(eligibility()->forJob($candidate->fresh(), $otherEntity)['code'])->toBe('blacklisted')
        ->and($general['code'])->toBe('blacklisted');

    expect($candidate->fresh()->applications()->where('is_flagged', true)->count())->toBe(0);
});

test('AR-04 existing applications are flagged when a candidate is blacklisted', function () {
    $candidate = Candidate::factory()->create();
    $application = Application::factory()->create(['candidate_id' => $candidate->id]);

    $candidate->update([
        'is_blacklisted' => true,
        'blacklist_reason' => 'Did not meet the group conduct standard.',
    ]);

    expect($application->fresh()->is_flagged)->toBeTrue();
});

test('AR-05 an expired role block no longer stops an application', function () {
    $candidate = Candidate::factory()->create();
    $job = JobPosting::factory()->published()->create(['role_key' => 'designer']);

    RoleBlock::query()->create([
        'candidate_id' => $candidate->id,
        'role_key' => $job->role_key,
        'blocked_until' => now()->subDay(),
        'reason' => 'Rejected after shortlisting',
    ]);

    expect(eligibility()->forJob($candidate, $job)['eligible'])->toBeTrue();
    $this->artisan('blocks:lift-expired')->assertSuccessful();
});

test('AR-05 an overridden role block no longer stops an application', function () {
    $candidate = Candidate::factory()->create();
    $job = JobPosting::factory()->published()->create(['role_key' => 'recruiter']);

    RoleBlock::query()->create([
        'candidate_id' => $candidate->id,
        'role_key' => $job->role_key,
        'blocked_until' => now()->addMonths(6),
        'reason' => 'Rejected after shortlisting',
        'overridden_at' => now(),
        'override_reason' => 'The hiring manager asked for a new application.',
    ]);

    expect(eligibility()->forJob($candidate, $job)['eligible'])->toBeTrue();
});

test('AR-05 an expired blacklist no longer stops an application', function () {
    $candidate = Candidate::factory()->blacklisted()->create();
    $candidate->forceFill(['blacklist_until' => now()->subDay()])->save();
    $job = JobPosting::factory()->published()->create();

    expect(eligibility()->forJob($candidate->fresh(), $job)['eligible'])->toBeTrue()
        ->and(eligibility()->forGeneral($candidate->fresh(), \App\Models\Department::factory()->create()->id)['eligible'])->toBeTrue();
});

test('AR-06 draft closed and past-deadline jobs cannot be applied to', function () {
    $candidate = Candidate::factory()->create();
    $draft = JobPosting::factory()->create([
        'status' => JobStatus::Draft,
        'last_date_to_apply' => now()->addWeek()->toDateString(),
    ]);
    $closed = JobPosting::factory()->create([
        'status' => JobStatus::Closed,
        'last_date_to_apply' => now()->addWeek()->toDateString(),
    ]);
    $expired = JobPosting::factory()->published()->create([
        'last_date_to_apply' => now()->subDay()->toDateString(),
    ]);

    expect(eligibility()->forJob($candidate, $draft)['code'])->toBe('job_not_open')
        ->and(eligibility()->forJob($candidate, $draft)['message'])->toBe('This role is not open for applications.')
        ->and(eligibility()->forJob($candidate, $closed)['code'])->toBe('job_not_open')
        ->and(eligibility()->forJob($candidate, $expired)['code'])->toBe('deadline_passed')
        ->and(eligibility()->forJob($candidate, $expired)['message'])->toBe('The last date to apply has passed.');
});

test('a general application stays one open per department until it is closed or six months old', function () {
    $candidate = Candidate::factory()->create();
    $department = \App\Models\Department::factory()->create();
    $other = \App\Models\Department::factory()->create();

    $open = Application::factory()->general()->create([
        'candidate_id' => $candidate->id,
        'department_id' => $department->id,
    ]);

    $blocked = eligibility()->forGeneral($candidate, $department->id);
    expect($blocked['code'])->toBe('general_already_open')
        ->and($blocked['until'])->not->toBeNull()
        ->and($blocked['message'])->toContain('You already have an open application for this department')
        ->and(eligibility()->forGeneral($candidate, $other->id)['eligible'])->toBeTrue();

    $open->update(['status' => ApplicationStatus::Rejected]);
    expect(eligibility()->forGeneral($candidate->fresh(), $department->id)['eligible'])->toBeTrue();

    $aged = Application::factory()->general()->create([
        'candidate_id' => $candidate->id,
        'department_id' => $department->id,
    ]);
    $aged->forceFill(['applied_at' => now()->subMonths(7)])->save();

    expect(eligibility()->forGeneral($candidate->fresh(), $department->id)['eligible'])->toBeTrue();
});

test('candidates profiles and applications are never deleted and status changes send no mail', function () {
    Mail::fake();

    expect(in_array(SoftDeletes::class, class_uses_recursive(Candidate::class), true))->toBeFalse()
        ->and(in_array(SoftDeletes::class, class_uses_recursive(Application::class), true))->toBeFalse();

    $uris = collect(Route::getRoutes())
        ->filter(fn ($route) => in_array('DELETE', $route->methods(), true))
        ->map(fn ($route) => $route->uri())
        ->filter(fn ($uri) => preg_match('/candidate|application/i', $uri))
        ->reject(fn ($uri) => str_ends_with($uri, '/blacklist'))
        ->values()
        ->all();

    expect($uris)->toBe([]);

    $application = Application::factory()->create();
    $application->update(['status' => ApplicationStatus::UnderReview]);

    Mail::assertNothingOutgoing();
});
