<?php

use App\Models\Department;
use App\Models\Entity;
use App\Models\Skill;
use Database\Seeders\EntitySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

require_once __DIR__.'/Support.php';

uses(TestCase::class, RefreshDatabase::class);

beforeEach(fn () => $this->seed(EntitySeeder::class));

it('creates departments under a company, and allows the same name in two companies', function () {
    actingAsHr('Admin');

    $this->postJson('/api/v1/hr/lists/departments', ['name' => 'Engineering', 'entity' => 'webfolks'])->assertCreated()->assertJsonPath('data.entity.slug', 'webfolks');
    $this->postJson('/api/v1/hr/lists/departments', ['name' => 'Engineering', 'entity' => 'infolks'])->assertCreated();
    $this->postJson('/api/v1/hr/lists/departments', ['name' => 'Engineering', 'entity' => 'webfolks'])->assertUnprocessable()->assertJsonValidationErrors('name');
    $this->postJson('/api/v1/hr/lists/departments', ['name' => 'Human Resources'])->assertCreated()->assertJsonPath('data.entity', null);

    $names = fn (string $entity) => array_column($this->getJson("/api/v1/hr/lists/departments?entity={$entity}")->json('data'), 'name');
    expect($names('webfolks'))->toEqualCanonicalizing(['Engineering', 'Human Resources'])
        ->and($names('medrays'))->toBe(['Human Resources']);
});

it('links skills to companies, and treats a skill with no companies as open to all', function () {
    actingAsHr('Admin');

    $this->postJson('/api/v1/hr/lists/skills', ['name' => 'DICOM', 'entities' => ['medrays']])->assertCreated()->assertJsonPath('data.entities.0.slug', 'medrays');
    $this->postJson('/api/v1/hr/lists/skills', ['name' => 'Communication'])->assertCreated();
    $react = $this->postJson('/api/v1/hr/lists/skills', ['name' => 'React', 'entities' => ['webfolks']])->json('data.id');
    $this->patchJson("/api/v1/hr/lists/skills/{$react}", ['entities' => ['webfolks', 'infolks']])->assertOk();

    $names = fn (string $entity) => array_column($this->getJson("/api/v1/hr/lists/skills?entity={$entity}")->json('data'), 'name');
    expect($names('medrays'))->toEqualCanonicalizing(['DICOM', 'Communication'])
        ->and($names('infolks'))->toEqualCanonicalizing(['Communication', 'React']);

    $skills = collect($this->getJson('/api/v1/public/meta')->json('data.skills'))->keyBy('name');
    expect($skills['DICOM']['entities'])->toBe(['medrays'])->and($skills['Communication']['entities'])->toBe([]);
});

it('refuses a job whose department belongs to another company', function () {
    actingAsHr('Admin');
    $medicalImaging = Department::factory()->create(['name' => 'Medical Imaging', 'entity_id' => Entity::query()->where('slug', 'medrays')->value('id')]);
    $shared = Department::factory()->create(['name' => 'Operations', 'entity_id' => null]);
    Skill::factory()->create(['name' => 'Python', 'slug' => 'python']);
    $job = fn (int $department) => [
        'title' => 'Analyst', 'entity' => 'webfolks', 'department_id' => $department, 'level' => 'all_level', 'location' => 'Kochi',
        'summary' => 'x', 'qualification' => 'x', 'experience' => '1 year', 'last_date_to_apply' => now()->addWeek()->toDateString(), 'skills' => ['python'],
    ];

    $this->postJson('/api/v1/hr/job-postings', $job($medicalImaging->id))->assertUnprocessable()->assertJsonValidationErrors('department_id');
    $this->postJson('/api/v1/hr/job-postings', $job($shared->id))->assertSuccessful();
});

it('explains a duplicate team name instead of failing', function () {
    actingAsHr('Admin');
    $department = Department::factory()->create(['name' => 'Engineering']);

    $this->postJson('/api/v1/hr/lists/teams', ['name' => 'Web', 'department_id' => $department->id])->assertCreated();
    $this->postJson('/api/v1/hr/lists/teams', ['name' => 'Web', 'department_id' => $department->id])
        ->assertUnprocessable()->assertJsonPath('errors.name.0', 'This department already has a team with this name.');
});
