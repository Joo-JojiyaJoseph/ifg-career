<?php

namespace App\Http\Resources;

use App\Enums\ApplicationStatus;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HrCandidateResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'public_id' => $this->public_id,
            'name' => $this->name,
            'email' => $this->email,
            'initials' => $this->initials,
            'avatar_url' => $this->avatar_url,
            'phone' => $this->phone,
            'location' => $this->location,
            'date_of_birth' => $this->date_of_birth?->toDateString(),
            'age' => $this->age,
            'gender' => $this->enumValue($this->gender),
            'highest_qualification' => $this->highest_qualification,
            'years_experience' => $this->years_experience !== null ? (float) $this->years_experience : null,
            'current_ctc' => $this->current_ctc !== null ? (float) $this->current_ctc : null,
            'expected_ctc' => $this->expected_ctc !== null ? (float) $this->expected_ctc : null,
            'linkedin_url' => $this->linkedin_url,
            'portfolio_url' => $this->portfolio_url,
            'reference_id' => $this->reference_id,
            'signup_source' => $this->enumValue($this->signup_source),
            'colour_tag' => $this->enumValue($this->colour_tag),
            'is_blacklisted' => $this->is_blacklisted_now,
            'blacklisted_at' => $this->blacklisted_at?->toIso8601String(),
            'blacklist_until' => $this->blacklist_until?->toDateString(),
            'blacklist_reason' => $this->blacklist_reason,
            'blacklisted_by' => $this->whenLoaded('blacklistedBy', fn () => $this->blacklistedBy?->name),
            'profile_completion_percent' => $this->profile_completion_percent,
            'profile_complete' => $this->profile_completed_at !== null,
            'has_resume' => filled($this->resume_path),
            'resume_filename' => $this->resume_original_name,
            'applications_count' => $this->whenCounted('applications'),
            'active_role_blocks_count' => $this->whenCounted('activeRoleBlocks'),
            'preferred_department' => $this->whenLoaded('preferredDepartment', fn () => $this->preferredDepartment ? [
                'name' => $this->preferredDepartment->name,
            ] : null),
            'latest_application' => $this->whenLoaded('latestApplication', fn () => $this->latestApplication ? [
                'public_id' => $this->latestApplication->public_id,
                'role' => $this->latestApplication->display_role,
                'status' => $this->latestApplication->status?->value,
                'applied_at' => $this->latestApplication->applied_at?->toDateString(),
                'entity' => $this->latestApplication->relationLoaded('entity') && $this->latestApplication->entity ? [
                    'name' => $this->latestApplication->entity->name,
                    'slug' => $this->latestApplication->entity->slug,
                    'theme' => $this->latestApplication->entity->theme,
                ] : null,
            ] : null),
            'applications' => $this->whenLoaded('applications', fn () => $this->applications->map(fn ($application) => [
                'public_id' => $application->public_id,
                'type' => $application->type?->value,
                'type_label' => $application->type?->label(),
                'role' => $application->display_role,
                'status' => $application->status?->value,
                'status_label' => $application->status?->label(),
                'status_color' => $application->status?->color(),
                'result' => $application->result?->value,
                'result_label' => $application->result?->label(),
                'source' => $application->source?->value,
                'source_label' => $application->source?->label(),
                'source_color' => $application->source?->color(),
                'referred' => $application->referred,
                'is_flagged' => $application->is_flagged,
                'applied_at' => $application->applied_at?->toDateString(),
                'level' => $application->jobPosting?->level?->label(),
                'entity' => $application->entity ? [
                    'name' => $application->entity->name,
                    'slug' => $application->entity->slug,
                    'theme' => $application->entity->theme,
                ] : null,
                'rounds' => $application->relationLoaded('interviewRounds')
                    ? $application->interviewRounds->map(fn ($round) => [
                        'round_number' => $round->round_number,
                        'round_name' => $round->round_name,
                        'scheduled_at' => $round->scheduled_at?->toIso8601String(),
                        'mode' => $round->mode?->label(),
                        'status' => $round->status?->value,
                        'status_label' => $round->status?->label(),
                        'status_color' => $round->status?->color(),
                        'interviewer_name' => $round->interviewer_name,
                    ])->values()
                    : [],
                'allowed_statuses' => collect(ApplicationStatus::cases())
                    ->filter(fn (ApplicationStatus $status) => $application->canTransitionTo($status))
                    ->map(fn (ApplicationStatus $status) => [
                        'value' => $status->value,
                        'label' => $status->label(),
                        'color' => $status->color(),
                    ])->values(),
            ])->values()),
            'notes' => CandidateNoteResource::collection($this->whenLoaded('notes')),
            'role_blocks' => RoleBlockResource::collection($this->whenLoaded('roleBlocks')),
        ];
    }

    /**
     * @return array{value: string, label: string, color: string}|null
     */
    private function enumValue(mixed $enum): ?array
    {
        if ($enum === null) {
            return null;
        }

        return [
            'value' => $enum->value,
            'label' => $enum->label(),
            'color' => $enum->color(),
        ];
    }
}
