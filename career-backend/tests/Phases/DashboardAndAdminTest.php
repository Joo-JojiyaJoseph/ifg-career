<?php

use App\Enums\ApplicationResult;
use App\Models\Application;
use App\Models\Candidate;
use App\Models\Department;
use App\Models\Entity;
use App\Models\InterviewRound;
use App\Models\JobPosting;
use App\Models\User;
use App\Notifications\HrInvite;
use App\Notifications\HrUserChanged;
use App\Services\ReportService;
use App\Support\PermissionCatalog;
use Database\Seeders\EntitySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Queue;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

require_once __DIR__.'/Support.php';

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    Queue::fake();
    $this->seed(EntitySeeder::class);
});

it('returns every dashboard widget', function () {
    actingAsHr();
    JobPosting::factory()->published()->count(2)->create();
    Application::factory()->count(3)->create();
    Application::factory()->shortlisted()->create();
    InterviewRound::factory()->create(['scheduled_at' => now()->addHours(3)]);

    $this->getJson('/api/v1/hr/dashboard/stats')->assertOk()
        ->assertJsonPath('data.active_openings.value', fn ($value) => $value >= 2)
        ->assertJsonCount(8, 'data.total_applicants.spark');
    $this->getJson('/api/v1/hr/dashboard/pipeline')->assertOk()->assertJsonStructure(['data' => ['applied', 'under_review', 'shortlisted', 'interview', 'selected', 'rejected', 'not_selected']]);
    $this->getJson('/api/v1/hr/dashboard/applications-over-time?range=3m')->assertOk()->assertJsonCount(13, 'data.buckets');
    $this->getJson('/api/v1/hr/dashboard/applications-over-time?range=1y')->assertOk()->assertJsonCount(12, 'data.buckets');
    $this->getJson('/api/v1/hr/dashboard/sources')->assertOk()->assertJsonCount(4, 'data');
    $this->getJson('/api/v1/hr/dashboard/upcoming-interviews')->assertOk()->assertJsonCount(1, 'data');
    $this->getJson('/api/v1/hr/dashboard/recent-candidates')->assertOk()->assertJsonCount(5, 'data');
    $this->getJson('/api/v1/hr/dashboard/action-items')->assertOk()->assertJsonStructure(['data' => ['new_since_login', 'interviews_today', 'sync_failed']]);
    $this->getJson('/api/v1/hr/dashboard/promo')->assertOk();
});

it('filters the dashboard by entity', function () {
    actingAsHr();
    $job = JobPosting::factory()->published()->create(['entity_id' => Entity::query()->where('slug', 'medrays')->value('id')]);
    Application::factory()->create(['job_posting_id' => $job->id]);
    Application::factory()->count(2)->create();

    $this->getJson('/api/v1/hr/dashboard/stats?entity=medrays')->assertOk()->assertJsonPath('data.total_applicants.value', 1);
});

it('searches candidates and jobs from the top bar', function () {
    actingAsHr();
    Candidate::factory()->create(['name' => 'Revathi Menon']);
    JobPosting::factory()->create(['title' => 'Revenue Analyst']);

    $this->getJson('/api/v1/hr/search?q=Rev')->assertOk()
        ->assertJsonPath('data.candidates.0.title', 'Revathi Menon')
        ->assertJsonPath('data.jobs.0.title', 'Revenue Analyst');
});

it('runs every report', function () {
    actingAsHr();
    Application::factory()->count(2)->create(['referred' => true]);
    Application::factory()->shortlisted()->create(['shortlisted_at' => now(), 'result' => ApplicationResult::Selected]);

    foreach (array_keys(ReportService::REPORTS) as $report) {
        $this->getJson("/api/v1/hr/reports/{$report}")->assertOk()->assertJsonStructure(['data' => ['title', 'columns', 'rows']]);
    }

    $this->getJson('/api/v1/hr/reports/by-source')->assertOk()->assertJsonCount(4, 'data.rows');
});

it('lets only admins manage HR users, and invites new users by email', function () {
    Notification::fake();
    actingAsHr('HR');
    $this->getJson('/api/v1/hr/users')->assertForbidden();

    $admin = actingAsHr('Admin');
    $other = User::factory()->create(['is_active' => true]);
    $other->assignRole('Admin');

    $created = $this->postJson('/api/v1/hr/users', ['name' => 'Neha Pillai', 'email' => 'neha@infolksgroup.com', 'role' => 'HR'])
        ->assertCreated()->assertJsonPath('data.role', 'HR')->json('data');

    $user = User::query()->find($created['id']);
    Notification::assertSentTo($user, HrInvite::class);
    Notification::assertSentTo($other, HrUserChanged::class);
    Notification::assertNotSentTo($admin, HrUserChanged::class);

    $this->postJson('/api/v1/hr/users', ['name' => 'Again', 'email' => 'neha@infolksgroup.com', 'role' => 'HR'])->assertUnprocessable();
});

it('protects the last admin and the signed-in user', function () {
    $admin = actingAsHr('Admin');

    $this->postJson("/api/v1/hr/users/{$admin->id}/toggle-active", ['is_active' => false])->assertUnprocessable();
    $this->patchJson("/api/v1/hr/users/{$admin->id}", ['role' => 'HR'])->assertUnprocessable();
});

it('deactivates a user and resets two-step verification', function () {
    Notification::fake();
    actingAsHr('Admin');
    $user = User::factory()->create(['is_active' => true, 'two_factor_confirmed_at' => now(), 'two_factor_secret' => 'ABC']);
    $user->assignRole('HR');

    $this->postJson("/api/v1/hr/users/{$user->id}/reset-2fa")->assertOk()->assertJsonPath('data.two_factor_enabled', false);
    $this->postJson("/api/v1/hr/users/{$user->id}/toggle-active", ['is_active' => false])->assertOk()->assertJsonPath('data.is_active', false);
});

it('edits the HR role permissions but never the Admin role', function () {
    actingAsHr('Admin');

    $this->putJson('/api/v1/hr/roles-permissions', ['roles' => ['HR' => ['jobs.view'], 'Admin' => []]])->assertOk();

    expect(Role::findByName('HR', 'web')->permissions->pluck('name')->all())->toBe(['jobs.view'])
        ->and(Role::findByName('Admin', 'web')->permissions()->count())->toBe(count(PermissionCatalog::ALL));

    $this->putJson('/api/v1/hr/roles-permissions', ['roles' => ['Ghost' => ['jobs.view']]])->assertUnprocessable();
});

it('manages departments, teams and skills and refuses to delete items in use', function () {
    actingAsHr('Admin');

    $department = $this->postJson('/api/v1/hr/lists/departments', ['name' => 'Quality'])->assertCreated()->json('data');
    $this->postJson('/api/v1/hr/lists/teams', ['name' => 'QA Automation', 'department_id' => $department['id']])->assertCreated();
    $this->postJson('/api/v1/hr/lists/skills', ['name' => 'Playwright'])->assertCreated();
    $this->postJson('/api/v1/hr/lists/departments', ['name' => 'Quality'])->assertUnprocessable();

    JobPosting::factory()->create(['department_id' => $department['id']]);
    $this->deleteJson("/api/v1/hr/lists/departments/{$department['id']}")->assertUnprocessable();
    $this->patchJson("/api/v1/hr/lists/departments/{$department['id']}", ['is_active' => false])->assertOk()->assertJsonPath('data.is_active', false);
    expect(Department::query()->find($department['id'])->is_active)->toBeFalse();
});

it('shows system health to admins', function () {
    actingAsHr('Admin');

    $this->getJson('/api/v1/hr/system/health')->assertOk()->assertJsonStructure(['data' => ['queue', 'failed_jobs', 'integrations', 'app']]);
    $this->postJson('/api/v1/hr/system/test/mail')->assertOk();
});

it('lists audit entries without exposing changed values', function () {
    actingAsHr('Admin');
    $job = JobPosting::factory()->create();
    $job->update(['title' => 'Updated title']);

    $response = $this->getJson('/api/v1/hr/audit-logs?type=JobPosting')->assertOk();
    expect($response->json('meta.total'))->toBeGreaterThan(0)
        ->and(json_encode($response->json('data')))->not->toContain('Updated title');

    actingAsHr('HR');
    $this->getJson('/api/v1/hr/audit-logs')->assertForbidden();
});

it('serves a sitemap with open jobs only', function () {
    $open = JobPosting::factory()->published()->create(['title' => 'Open Role']);
    $closed = JobPosting::factory()->closed()->create();

    $response = $this->get('/sitemap.xml')->assertOk()->assertHeader('Content-Type', 'application/xml; charset=UTF-8');

    expect($response->getContent())->toContain($open->public_id)->not->toContain($closed->public_id);
});

it('sends security headers on API responses', function () {
    $this->getJson('/api/v1/public/meta')
        ->assertHeader('X-Frame-Options', 'DENY')
        ->assertHeader('X-Content-Type-Options', 'nosniff')
        ->assertHeader('Content-Security-Policy');
});
