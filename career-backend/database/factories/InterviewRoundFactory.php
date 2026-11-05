<?php

namespace Database\Factories;

use App\Enums\CalendarSyncStatus;
use App\Enums\InterviewMode;
use App\Enums\RoundStatus;
use App\Models\Application;
use App\Models\InterviewRound;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<InterviewRound>
 */
class InterviewRoundFactory extends Factory
{
    protected $model = InterviewRound::class;

    public function definition(): array
    {
        return [
            'application_id' => Application::factory()->shortlisted(),
            'round_number' => 1,
            'round_name' => 'Technical round',
            'scheduled_at' => now()->addDays(2),
            'duration_minutes' => 60,
            'mode' => InterviewMode::Video,
            'location_or_link' => 'https://meet.example.com/infolks-group',
            'interviewer_name' => 'HR Coordinator',
            'interviewer_email' => 'hr@infolksgroup.com',
            'status' => RoundStatus::Scheduled,
            'calendar_sync_status' => CalendarSyncStatus::Pending,
        ];
    }

    public function passed(): static
    {
        return $this->state(fn () => [
            'status' => RoundStatus::Passed,
            'feedback' => 'Strong problem solving and clear communication.',
        ]);
    }

    public function syncFailed(): static
    {
        return $this->state(fn () => [
            'calendar_sync_status' => CalendarSyncStatus::Failed,
            'calendar_sync_error' => 'Google Calendar is not configured.',
        ]);
    }
}
