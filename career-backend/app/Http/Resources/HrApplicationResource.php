<?php

namespace App\Http\Resources;

use App\Enums\ApplicationStatus;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HrApplicationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'public_id' => $this->public_id,
            'type' => $this->enumValue($this->type),
            'role' => $this->display_role,
            'level' => $this->jobPosting?->level ? [
                'value' => $this->jobPosting->level->value,
                'label' => $this->jobPosting->level->label(),
                'color' => $this->jobPosting->level->color(),
            ] : null,
            'source' => $this->enumValue($this->source),
            'referred' => $this->referred,
            'reference_id' => $this->reference_id,
            'status' => $this->status?->value,
            'status_label' => $this->status?->label(),
            'status_color' => $this->status?->color(),
            'result' => $this->result?->value,
            'result_label' => $this->result?->label(),
            'result_color' => $this->result?->color(),
            'is_flagged' => $this->is_flagged,
            'applied_at' => $this->applied_at?->toIso8601String(),
            'has_interview' => ($this->interview_rounds_count ?? 0) > 0,
            'allowed_statuses' => collect(ApplicationStatus::cases())
                ->filter(fn (ApplicationStatus $status) => $this->canTransitionTo($status))
                ->map(fn (ApplicationStatus $status) => [
                    'value' => $status->value,
                    'label' => $status->label(),
                    'color' => $status->color(),
                ])->values(),
            'candidate' => $this->whenLoaded('candidate', fn () => $this->candidate ? [
                'public_id' => $this->candidate->public_id,
                'name' => $this->candidate->name,
                'email' => $this->candidate->email,
                'initials' => $this->candidate->initials,
                'is_blacklisted' => $this->candidate->is_blacklisted_now,
            ] : null),
            'entity' => $this->whenLoaded('entity', fn () => $this->entity ? [
                'name' => $this->entity->name,
                'slug' => $this->entity->slug,
                'theme' => $this->entity->theme,
            ] : null),
            'department' => $this->whenLoaded('department', fn () => $this->department ? [
                'name' => $this->department->name,
            ] : null),
            'job' => $this->whenLoaded('jobPosting', fn () => $this->jobPosting ? [
                'public_id' => $this->jobPosting->public_id,
                'title' => $this->jobPosting->title,
            ] : null),
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
