<?php

use App\Enums\ApplicationStatus;
use App\Enums\ApplicationType;
use App\Models\Application;
use App\Models\AuditLog;
use App\Models\Candidate;
use App\Models\JobPosting;
use App\Models\RoleBlock;
use App\Models\User;
use App\Notifications\ExportReady;
use Database\Seeders\HrUserSeeder;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    $this->seed(HrUserSeeder::class);
    loginHr();
});

test('hr can filter candidates and the result count follows the filter', function () {
    Candidate::factory()->create([
        'name' => 'Ananya Iyer',
        'email' => 'ananya.iyer@example.com',
        'location' => 'Kochi',
        'date_of_birth' => now()->subYears(28)->toDateString(),
    ]);
    Candidate::factory()->blacklisted()->create([
        'name' => 'Rahul Menon',
        'email' => 'rahul.menon@example.com',
        'date_of_birth' => now()->subYears(45)->toDateString(),
    ]);

    $all = portalJson('GET', '/api/v1/hr/candidates')->assertOk();
    expect($all->json('meta.total'))->toBe(2)
        ->and($all->json('counts.blacklisted'))->toBe(1)
        ->and($all->json('data.0'))->not->toHaveKey('id');

    $named = portalJson('GET', '/api/v1/hr/candidates?q=Ananya')->assertOk();
    expect($named->json('meta.total'))->toBe(1)
        ->and($named->json('data.0.name'))->toBe('Ananya Iyer');

    $young = portalJson('GET', '/api/v1/hr/candidates?age_min=20&age_max=35')->assertOk();
    expect($young->json('meta.total'))->toBe(1)
        ->and($young->json('data.0.name'))->toBe('Ananya Iyer');

    $blocked = portalJson('GET', '/api/v1/hr/candidates?blacklisted=1')->assertOk();
    expect($blocked->json('meta.total'))->toBe(1)
        ->and($blocked->json('data.0.name'))->toBe('Rahul Menon');
});

test('blacklisting flags open applications and is written to the audit log', function () {
    $candidate = Candidate::factory()->create();
    $open = Application::factory()->create(['candidate_id' => $candidate->id, 'status' => ApplicationStatus::Applied]);
    $closed = Application::factory()->create(['candidate_id' => $candidate->id, 'status' => ApplicationStatus::Rejected]);

    portalJson('POST', '/api/v1/hr/candidates/'.$candidate->public_id.'/blacklist', [
        'reason' => 'Did not attend two scheduled conversations.',
    ])->assertOk()
        ->assertJsonPath('data.is_blacklisted', true);

    $fresh = $candidate->fresh();
    expect($fresh->blacklist_until)->not->toBeNull()
        ->and($fresh->blacklist_until->greaterThan(now()->addMonths(5)))->toBeTrue()
        ->and($open->fresh()->is_flagged)->toBeTrue()
        ->and($closed->fresh()->is_flagged)->toBeFalse()
        ->and(AuditLog::query()->where('action', 'candidate.blacklisted')->where('auditable_id', $candidate->id)->exists())->toBeTrue();

    portalJson('DELETE', '/api/v1/hr/candidates/'.$candidate->public_id.'/blacklist', [
        'reason' => 'The report was withdrawn.',
    ])->assertOk()->assertJsonPath('data.is_blacklisted', false);

    expect($open->fresh()->is_flagged)->toBeFalse()
        ->and(AuditLog::query()->where('action', 'candidate.unblacklisted')->exists())->toBeTrue();
});

test('hr without blacklist permission cannot blacklist a candidate', function () {
    $candidate = Candidate::factory()->create();
    Role::findByName('HR')->revokePermissionTo('candidates.blacklist');
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    portalJson('POST', '/api/v1/hr/candidates/'.$candidate->public_id.'/blacklist', [
        'reason' => 'Not allowed for this role.',
    ])->assertForbidden();
});

test('overriding a role block requires a reason and is audited', function () {
    $candidate = Candidate::factory()->create();
    $block = RoleBlock::factory()->create([
        'candidate_id' => $candidate->id,
        'role_key' => 'platform engineer',
        'blocked_until' => now()->addMonths(4),
        'source_application_id' => null,
    ]);

    portalJson('POST', '/api/v1/hr/candidates/'.$candidate->public_id.'/role-blocks/'.rawurlencode('platform engineer').'/override', [])
        ->assertUnprocessable();

    portalJson('POST', '/api/v1/hr/candidates/'.$candidate->public_id.'/role-blocks/'.rawurlencode('platform engineer').'/override', [
        'reason' => 'The hiring manager asked for another look.',
    ])->assertOk()
        ->assertJsonPath('data.active', false)
        ->assertJsonPath('data.role_key', 'platform engineer');

    expect($block->fresh()->overridden_at)->not->toBeNull()
        ->and(AuditLog::query()->where('action', 'role_block.overridden')->where('auditable_id', $block->id)->exists())->toBeTrue();
});

test('status changes never email the candidate and can be undone', function () {
    Mail::fake();
    $application = Application::factory()->shortlisted()->create();

    portalJson('PATCH', '/api/v1/hr/applications/'.$application->public_id.'/status', [
        'status' => 'rejected',
    ])->assertOk()->assertJsonPath('data.status', 'rejected');

    Mail::assertNothingQueued();
    expect(RoleBlock::query()->active()->where('candidate_id', $application->candidate_id)->exists())->toBeTrue();

    portalJson('POST', '/api/v1/hr/applications/'.$application->public_id.'/undo-status')
        ->assertOk()
        ->assertJsonPath('data.status', 'shortlisted');

    expect(RoleBlock::query()->active()->where('source_application_id', $application->id)->exists())->toBeFalse();
    Mail::assertNothingQueued();
});

test('application tabs and filters return counts for job and general applications', function () {
    Application::factory()->create();
    Application::factory()->general()->create();

    $all = portalJson('GET', '/api/v1/hr/applications')->assertOk();
    expect($all->json('meta.total'))->toBe(2)
        ->and($all->json('counts.type.job'))->toBe(1)
        ->and($all->json('counts.type.general'))->toBe(1)
        ->and($all->json('data.0'))->not->toHaveKey('id');

    $general = portalJson('GET', '/api/v1/hr/applications?type=general')->assertOk();
    expect($general->json('meta.total'))->toBe(1)
        ->and($general->json('data.0.type.value'))->toBe('general')
        ->and($general->json('counts.type.job'))->toBe(1);
});

test('a general application can be assigned to an open role and keeps its record', function () {
    $application = Application::factory()->general()->create(['status' => ApplicationStatus::Applied]);
    $job = JobPosting::factory()->published()->create(['title' => 'Clinical analyst']);
    $publicId = $application->public_id;

    portalJson('POST', '/api/v1/hr/applications/'.$publicId.'/assign-job', [
        'job' => $job->public_id,
    ])->assertOk()
        ->assertJsonPath('data.public_id', $publicId)
        ->assertJsonPath('data.type.value', 'job')
        ->assertJsonPath('data.role', 'Clinical analyst');

    expect(Application::query()->where('public_id', $publicId)->first()->type)->toBe(ApplicationType::Job);
});

test('hr can add a note and set a colour tag', function () {
    $candidate = Candidate::factory()->create();

    portalJson('POST', '/api/v1/hr/candidates/'.$candidate->public_id.'/notes', [
        'body' => 'Called and left a message.',
    ])->assertCreated()->assertJsonPath('data.body', 'Called and left a message.');

    portalJson('PATCH', '/api/v1/hr/candidates/'.$candidate->public_id, [
        'colour_tag' => 'contacted',
    ])->assertOk()->assertJsonPath('data.colour_tag.value', 'contacted');
});

test('a queued export writes an excel file and notifies the requester', function () {
    Storage::fake('private');
    Notification::fake();
    Candidate::factory()->create(['name' => 'Export Me']);

    $created = portalJson('POST', '/api/v1/hr/exports', [
        'type' => 'candidates',
        'filters' => ['q' => 'Export'],
    ])->assertStatus(202);

    $exportId = $created->json('data.id');
    expect($created->json('data.status'))->toBe('ready')
        ->and($created->json('data.row_count'))->toBe(1);

    $hr = User::query()->where('email', 'hr@infolksgroup.com')->first();
    Notification::assertSentTo($hr, ExportReady::class);
    expect(AuditLog::query()->where('action', 'export.queued')->exists())->toBeTrue();

    $files = Storage::disk('private')->allFiles('exports');
    expect($files)->not->toBeEmpty()
        ->and(substr(Storage::disk('private')->get($files[0]), 0, 2))->toBe('PK');

    $download = portalJson('GET', '/api/v1/hr/exports/'.$exportId.'/download')->assertOk();
    expect(substr($download->streamedContent(), 0, 2))->toBe('PK');
});

test('a resume is served from a short-lived signed url', function () {
    Storage::fake('private');
    Storage::disk('private')->put('resumes/sample.pdf', '%PDF-1.4 sample');
    $candidate = Candidate::factory()->create([
        'resume_path' => 'resumes/sample.pdf',
        'resume_original_name' => 'sample.pdf',
    ]);

    $links = portalJson('GET', '/api/v1/hr/candidates/'.$candidate->public_id.'/resume')->assertOk();
    $url = $links->json('data.preview_url');
    expect($links->json('data.preview'))->toBeTrue();

    $this->get($url)->assertOk()
        ->assertHeader('X-Content-Type-Options', 'nosniff')
        ->assertHeader('content-security-policy', 'frame-ancestors http://localhost:5174');

    $this->get('/api/v1/hr/candidates/'.$candidate->public_id.'/resume/file')->assertForbidden();
});
