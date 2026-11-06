<?php

namespace App\Http\Resources;

use App\Enums\RoundStatus;
use App\Models\Application;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Application */
class InterviewApplicationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $rounds = $this->relationLoaded('interviewRounds') ? $this->interviewRounds : collect();
        $allPassed = $rounds->isNotEmpty() && $rounds->every(fn ($round) => $round->status === RoundStatus::Passed);
        $open = $rounds->contains(fn ($round) => in_array($round->status, [RoundStatus::Scheduled, RoundStatus::Completed, RoundStatus::NotSelected], true));

        return [
            'public_id' => $this->public_id,
            'role' => $this->display_role,
            'status' => InterviewRoundResource::enum($this->status),
            'result' => InterviewRoundResource::enum($this->result),
            'shortlisted_at' => $this->shortlisted_at?->toIso8601String(),
            'is_flagged' => $this->is_flagged,
            'can_schedule' => $this->status?->value === 'shortlisted' && $this->result === null && ! $open && ! $this->is_flagged,
            'can_select' => $this->status?->value === 'shortlisted' && $this->result === null && $allPassed,
            'can_reject' => $this->status?->value === 'shortlisted' && $this->result === null,
            'candidate' => $this->whenLoaded('candidate', fn () => $this->candidate ? [
                'public_id' => $this->candidate->public_id,
                'name' => $this->candidate->name,
                'email' => $this->candidate->email,
                'initials' => $this->candidate->initials,
                'avatar_url' => $this->candidate->avatar_url,
            ] : null),
            'entity' => $this->whenLoaded('entity', fn () => $this->entity ? [
                'name' => $this->entity->name,
                'slug' => $this->entity->slug,
                'theme' => $this->entity->theme,
            ] : null),
            'rounds' => $rounds->map(fn ($round) => [
                'public_id' => $round->public_id,
                'round_number' => $round->round_number,
                'round_name' => $round->round_name,
                'scheduled_at' => $round->scheduled_at?->toIso8601String(),
                'status' => InterviewRoundResource::enum($round->status),
            ])->values(),
        ];
    }
}
