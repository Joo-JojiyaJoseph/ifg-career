<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\URL;

class JobPostingResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'public_id' => $this->public_id,
            'title' => $this->title,
            'slug' => $this->slug,
            'role_key' => $this->role_key,
            'path' => '/jobs/'.$this->slug.'-'.$this->public_id,
            'level' => [
                'value' => $this->level?->value,
                'label' => $this->level?->label(),
                'color' => $this->level?->color(),
            ],
            'location' => $this->location,
            'summary' => $this->summary,
            'qualification' => $this->qualification,
            'experience' => $this->experience,
            'why_join_us' => $this->why_join_us,
            'status' => $this->status?->value,
            'status_label' => $this->status?->label(),
            'status_color' => $this->status?->color(),
            'posted_at' => $this->posted_at?->toIso8601String(),
            'published_at' => $this->published_at?->toIso8601String(),
            'closed_at' => $this->closed_at?->toIso8601String(),
            'last_date_to_apply' => $this->last_date_to_apply?->toDateString(),
            'days_left' => $this->days_left,
            'is_open' => $this->is_open,
            'applications_count' => $this->whenCounted('applications'),
            'entity' => $this->whenLoaded('entity', fn () => $this->entity ? [
                'name' => $this->entity->name,
                'slug' => $this->entity->slug,
                'motto' => $this->entity->motto,
                'theme' => $this->entity->theme,
            ] : null),
            'department' => $this->whenLoaded('department', fn () => $this->department ? [
                'id' => $this->department->id,
                'name' => $this->department->name,
            ] : null),
            'team' => $this->whenLoaded('team', fn () => $this->team ? [
                'id' => $this->team->id,
                'name' => $this->team->name,
                'department_id' => $this->team->department_id,
            ] : null),
            'skills' => $this->whenLoaded('skills', fn () => $this->skills->map(fn ($skill) => [
                'name' => $skill->name,
                'slug' => $skill->slug,
            ])->values()),
            'created_by' => $this->whenLoaded('creator', fn () => $this->creator ? [
                'name' => $this->creator->name,
                'email' => $this->creator->email,
            ] : null),
            'preview_url' => URL::temporarySignedRoute(
                'public.jobs.show',
                now()->addHours(12),
                ['jobPosting' => $this->public_id],
            ),
        ];
    }
}
