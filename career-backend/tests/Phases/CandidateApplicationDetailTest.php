<?php

/*
 * A candidate's own application page (My Applications → one application): its steps, a plain message and
 * their interviews, without HR feedback, round outcomes or the final result.
 */

use App\Enums\ApplicationResult;
use App\Enums\ApplicationStatus;
use App\Enums\RoundStatus;
use App\Models\Application;
use App\Models\Candidate;
use App\Models\InterviewRound;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

it('shows a candidate where their application is and the details of an upcoming interview', function () {
    $round = InterviewRound::factory()->create([
        'status' => RoundStatus::Scheduled,
        'round_name' => 'Technical round',
        'location_or_link' => 'https://meet.example.com/abc',
        'feedback' => 'Internal note',
    ]);
    $application = $round->application;
    $application->forceFill(['status' => ApplicationStatus::Shortlisted])->save();

    $data = $this->actingAs($application->candidate, 'candidate')
        ->getJson('/api/v1/candidate/applications/'.$application->public_id)
        ->assertOk()->json('data');

    expect($data['status'])->toBe('interview_scheduled')
        ->and($data['message'])->toContain('interview is scheduled')
        ->and(collect($data['steps'])->pluck('state', 'key')->all())->toBe([
            'applied' => 'done', 'in_review' => 'done', 'shortlisted' => 'done', 'interviews' => 'current', 'decision' => 'next',
        ])
        ->and($data['interviews'][0])->toMatchArray(['round_name' => 'Technical round', 'upcoming' => true, 'location_or_link' => 'https://meet.example.com/abc'])
        ->and(json_encode($data))->not->toContain('Internal note')->not->toContain('feedback');
});

it('tells the candidate the final result, but not round outcomes or feedback', function () {
    $round = InterviewRound::factory()->create(['status' => RoundStatus::NotSelected, 'feedback' => 'Weak on SQL']);
    $application = $round->application;
    $application->forceFill(['status' => ApplicationStatus::Shortlisted, 'result' => ApplicationResult::NotSelected])->save();

    $data = $this->actingAs($application->candidate, 'candidate')
        ->getJson('/api/v1/candidate/applications/'.$application->public_id)
        ->assertOk()->json('data');

    expect($data['status'])->toBe('not_selected')
        ->and($data['result'])->toBe('not_selected')
        ->and(collect($data['steps'])->last())->toMatchArray(['label' => 'Decision: Not selected', 'state' => 'done'])
        ->and($data['interviews'][0])->toMatchArray(['upcoming' => false, 'location_or_link' => null])
        ->and(json_encode($data))->not->toContain('Weak on SQL');

    $this->getJson('/api/v1/candidate/applications?status=not_selected')->assertOk()->assertJsonCount(1, 'data');
    $this->getJson('/api/v1/candidate/applications?status=closed')->assertOk()->assertJsonCount(0, 'data');
});

it('congratulates a selected candidate', function () {
    $application = Application::factory()->create(['status' => ApplicationStatus::Shortlisted, 'result' => ApplicationResult::Selected]);

    $data = $this->actingAs($application->candidate, 'candidate')
        ->getJson('/api/v1/candidate/applications/'.$application->public_id)
        ->assertOk()->json('data');

    expect($data['status'])->toBe('selected')->and($data['message'])->toContain('Congratulations');
});

it('shows a rejection before any interview as closed', function () {
    $application = Application::factory()->create(['status' => ApplicationStatus::Rejected, 'result' => null]);

    $data = $this->actingAs($application->candidate, 'candidate')
        ->getJson('/api/v1/candidate/applications/'.$application->public_id)
        ->assertOk()->json('data');

    expect($data['status'])->toBe('closed')->and($data['result'])->toBeNull();
});

it('does not show one candidate another candidate\'s application', function () {
    $application = Application::factory()->create();

    $this->actingAs(Candidate::factory()->create(), 'candidate')
        ->getJson('/api/v1/candidate/applications/'.$application->public_id)
        ->assertNotFound();
});

it('needs a signed-in candidate', function () {
    $application = Application::factory()->create();

    $this->getJson('/api/v1/candidate/applications/'.$application->public_id)->assertUnauthorized();
});
