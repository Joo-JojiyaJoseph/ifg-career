<?php

namespace App\Http\Resources;

use App\Models\InterviewRound;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin InterviewRound */
class InterviewRoundResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'public_id' => $this->public_id,
            'round_number' => $this->round_number,
            'round_name' => $this->round_name,
            'scheduled_at' => $this->scheduled_at?->toIso8601String(),
            'ends_at' => $this->scheduled_at ? $this->endsAt()->toIso8601String() : null,
            'duration_minutes' => $this->duration_minutes,
            'mode' => self::enum($this->mode),
            'location_or_link' => $this->location_or_link,
            'interviewer_name' => $this->interviewer_name,
            'interviewer_email' => $this->interviewer_email,
            'status' => self::enum($this->status),
            'allowed_statuses' => collect($this->allowedStatuses())->map(fn ($status) => self::enum($status))->values(),
            'feedback' => $this->feedback,
            'calendar' => [
                'status' => self::enum($this->calendar_sync_status),
                'error' => $this->calendar_sync_error,
                'synced_at' => $this->calendar_synced_at?->toIso8601String(),
                'has_event' => filled($this->google_event_id),
            ],
            'created_by' => $this->whenLoaded('creator', fn () => $this->creator?->name),
            'application' => $this->whenLoaded('application', fn () => [
                'public_id' => $this->application->public_id,
                'role' => $this->application->display_role,
                'status' => self::enum($this->application->status),
                'result' => self::enum($this->application->result),
                'candidate' => $this->application->relationLoaded('candidate') && $this->application->candidate ? [
                    'public_id' => $this->application->candidate->public_id,
                    'name' => $this->application->candidate->name,
                    'initials' => $this->application->candidate->initials,
                    'avatar_url' => $this->application->candidate->avatar_url,
                ] : null,
                'entity' => $this->application->relationLoaded('entity') && $this->application->entity ? [
                    'name' => $this->application->entity->name,
                    'slug' => $this->application->entity->slug,
                    'theme' => $this->application->entity->theme,
                ] : null,
            ]),
        ];
    }

    /**
     * @return array{value: string, label: string, color: string}|null
     */
    public static function enum(mixed $enum): ?array
    {
        return $enum === null ? null : [
            'value' => $enum->value,
            'label' => $enum->label(),
            'color' => $enum->color(),
        ];
    }
}
