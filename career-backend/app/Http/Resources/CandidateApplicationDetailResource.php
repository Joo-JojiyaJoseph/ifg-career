<?php

namespace App\Http\Resources;

use App\Enums\ApplicationStatus;
use App\Enums\RoundStatus;
use Illuminate\Http\Request;

/**
 * One application as the candidate sees it: where it is on the path, a plain-language note, and their interviews.
 * The final result (Selected / Not selected) is shown; HR feedback and individual round outcomes are not.
 */
class CandidateApplicationDetailResource extends CandidateApplicationResource
{
    private const FINAL = ['selected', 'not_selected', 'closed'];

    private const MESSAGES = [
        'applied' => 'We have received your application. The hiring team will review it soon.',
        'in_review' => 'The hiring team is reviewing your application.',
        'shortlisted' => 'You have been shortlisted. The hiring team will contact you to arrange an interview.',
        'interview_scheduled' => 'Your interview is scheduled. The details are below; you will also get an email.',
        'selected' => 'Congratulations! You have been selected for this role. The hiring team will contact you by email or phone about the next steps.',
        'not_selected' => 'Thank you for your time and interest. After careful consideration, the team has decided not to move forward with your application for this role. You are welcome to apply for other openings.',
        'closed' => 'This application is closed. Thank you for your interest; you are welcome to apply for other openings.',
    ];

    public function toArray(Request $request): array
    {
        $status = $this->candidateStatusCode();
        $history = $this->statusHistories->pluck('to_status')->map(fn ($value) => $value instanceof ApplicationStatus ? $value : ApplicationStatus::tryFrom((string) $value));
        $rounds = $this->interviewRounds;
        $reached = fn (ApplicationStatus $step) => $this->status === $step || $history->contains($step);
        $reviewed = $reached(ApplicationStatus::UnderReview) || $reached(ApplicationStatus::Shortlisted) || $rounds->isNotEmpty();
        $shortlisted = $reached(ApplicationStatus::Shortlisted) || $rounds->isNotEmpty();

        $steps = [
            ['key' => 'applied', 'label' => 'Applied', 'state' => 'done', 'date' => $this->applied_at?->toDateString()],
            ['key' => 'in_review', 'label' => 'In review', 'state' => $reviewed ? 'done' : ($status === 'applied' ? 'next' : 'skipped')],
            ['key' => 'shortlisted', 'label' => 'Shortlisted', 'state' => $shortlisted ? 'done' : 'next'],
            ['key' => 'interviews', 'label' => 'Interviews', 'state' => $rounds->isEmpty() ? 'next' : ($status === 'interview_scheduled' ? 'current' : 'done')],
            ['key' => 'decision', 'label' => match ($status) {
                'selected' => 'Decision: Selected',
                'not_selected' => 'Decision: Not selected',
                'closed' => 'Decision: Closed',
                default => 'Decision',
            }, 'state' => in_array($status, self::FINAL, true) ? 'done' : 'next'],
        ];

        if (in_array($status, self::FINAL, true)) {
            // Steps never reached before the decision are shown as skipped, not as still to come.
            $steps = array_map(fn ($step) => $step['state'] === 'next' ? ['state' => 'skipped'] + $step : $step, $steps);
        } else {
            $current = collect($steps)->search(fn ($step) => $step['state'] === 'current');
            if ($current === false) {
                $first = collect($steps)->search(fn ($step) => $step['state'] === 'next');
                $last = $first === false ? count($steps) - 1 : max(0, $first - 1);
                $steps[$last]['state'] = 'current';
            }
        }

        return parent::toArray($request) + [
            'message' => self::MESSAGES[$status] ?? null,
            'job' => $this->jobPosting ? [
                'slug' => $this->jobPosting->slug,
                'location' => $this->jobPosting->location,
                'is_open' => $this->jobPosting->status?->value === 'published',
            ] : null,
            'department' => $this->department?->name ?? $this->jobPosting?->department?->name,
            'steps' => $steps,
            // Past interviews stay listed after a decision (as completed, without their outcome).
            'result' => in_array($status, ['selected', 'not_selected'], true) ? $status : null,
            'interviews' => $rounds->map(fn ($round) => [
                'round_number' => $round->round_number,
                'round_name' => $round->round_name,
                'upcoming' => $round->status === RoundStatus::Scheduled,
                'scheduled_at' => $round->scheduled_at?->toIso8601String(),
                'duration_minutes' => $round->duration_minutes,
                'mode' => $round->mode?->label(),
                // The meeting link or address only while the interview is still to come.
                'location_or_link' => $round->status === RoundStatus::Scheduled ? $round->location_or_link : null,
            ])->values(),
        ];
    }
}
