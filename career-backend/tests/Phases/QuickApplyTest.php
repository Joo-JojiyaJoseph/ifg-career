<?php

use App\Enums\ApplicationType;
use App\Models\Application;
use App\Models\Candidate;
use App\Models\Department;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

require_once __DIR__.'/Support.php';

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    Mail::fake();
    Queue::fake();
    config(['services.turnstile.secret' => null]);
});

function quickApplyPayload(array $overrides = []): array
{
    return $overrides + [
        'name' => 'Asha Menon',
        'date_of_birth' => now()->subYears(24)->toDateString(),
        'email' => 'asha.menon@example.com',
        'phone' => '+919847012345',
        'gender' => 'female',
        'highest_qualification' => 'B.Tech',
        'location' => 'Palakkad',
        'department_id' => Department::factory()->create()->id,
        'privacy_consent' => '1',
        'resume' => UploadedFile::fake()->create('resume.pdf', 20, 'application/pdf'),
    ];
}

it('asks for a gender of Male, Female or Other', function () {
    $this->post('/api/v1/public/quick-apply', quickApplyPayload(['gender' => '']), ['Accept' => 'application/json'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['gender' => 'Choose a gender.']);

    $this->post('/api/v1/public/quick-apply', quickApplyPayload(['gender' => 'unknown']), ['Accept' => 'application/json'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('gender');
});

it('signs a first-time candidate in, so Candidate profile shows the application', function () {
    $this->post('/api/v1/public/quick-apply', quickApplyPayload(), ['Accept' => 'application/json', 'Referer' => 'http://localhost:5173'])
        ->assertCreated()
        ->assertJsonPath('signed_in', true)
        ->assertJsonPath('profile_notice', null);

    $candidate = Candidate::query()->where('email', 'asha.menon@example.com')->firstOrFail();
    expect($candidate->gender?->value)->toBe('female')
        ->and(Application::query()->where('candidate_id', $candidate->id)->value('type'))->toBe(ApplicationType::General);
    $this->assertAuthenticatedAs($candidate, 'candidate');

    $this->getJson('/api/v1/candidate/applications')->assertOk()->assertJsonCount(1, 'data');
});

it('does not sign anyone in to a profile that already exists', function () {
    Candidate::factory()->create(['email' => 'asha.menon@example.com', 'google_id' => 'google-1']);

    $this->post('/api/v1/public/quick-apply', quickApplyPayload(), ['Accept' => 'application/json', 'Referer' => 'http://localhost:5173'])
        ->assertCreated()
        ->assertJsonPath('signed_in', false)
        ->assertJsonPath('profile_notice', 'This email already has a candidate profile. Sign in with Google to see the status of your applications.');

    $this->assertGuest('candidate');
});

it('lets HR filter applications by gender', function () {
    actingAsHr();
    Application::factory()->for(Candidate::factory()->state(['gender' => 'female']))->create();
    Application::factory()->for(Candidate::factory()->state(['gender' => 'male']))->count(2)->create();

    $this->getJson('/api/v1/hr/applications?gender=female')->assertOk()->assertJsonPath('meta.total', 1);
    $this->getJson('/api/v1/hr/applications?gender=male')->assertOk()->assertJsonPath('meta.total', 2);
    $this->getJson('/api/v1/hr/applications?gender=robot')->assertUnprocessable();
});
