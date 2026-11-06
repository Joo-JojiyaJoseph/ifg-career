<?php

namespace App\Http\Resources;

use App\Models\InterviewStep;
use App\Services\ApplicationEligibilityService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicJobResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $detail = $request->routeIs('public.jobs.show');

        return [
            'public_id' => $this->public_id,
            'title' => $this->title,
            'slug' => $this->slug,
            'path' => '/jobs/'.$this->slug.'-'.$this->public_id,
            'level' => [
                'value' => $this->level?->value,
                'label' => $this->level?->label(),
                'color' => $this->level?->color(),
            ],
            'location' => $this->location,
            'summary' => $this->summary,
            'qualification' => $this->when($detail, $this->qualification),
            'experience' => $this->when($detail, $this->experience),
            'why_join_us' => $this->when($detail, $this->why_join_us),
            'posted_at' => $this->posted_at?->toIso8601String(),
            'last_date_to_apply' => $this->last_date_to_apply?->toDateString(),
            'days_left' => $this->days_left,
            'is_open' => $this->is_open,
            'entity' => $this->entity ? [
                'name' => $this->entity->name,
                'slug' => $this->entity->slug,
                'motto' => $this->entity->motto,
                'short_description' => $this->entity->short_description,
                'website_url' => $this->entity->website_url,
                'theme' => $this->entity->theme,
            ] : null,
            'department' => $this->department ? [
                'id' => $this->department->id,
                'name' => $this->department->name,
            ] : null,
            'team' => $this->team ? [
                'id' => $this->team->id,
                'name' => $this->team->name,
            ] : null,
            'skills' => $this->skills->map(fn ($skill) => [
                'name' => $skill->name,
                'slug' => $skill->slug,
            ])->values(),
            'interview_steps' => $this->when($detail, fn () => InterviewStep::query()
                ->where('is_published', true)
                ->orderBy('sort_order')
                ->get(['name', 'description'])
                ->map(fn ($step) => ['name' => $step->name, 'description' => $step->description])
                ->values()),
            'eligibility' => $this->when($detail, function () {
                $candidate = auth('candidate')->user();

                return $candidate
                    ? app(ApplicationEligibilityService::class)->forJob($candidate, $this->resource)
                    : null;
            }),
        ];
    }
}
