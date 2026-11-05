<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RoleBlockResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $active = $this->overridden_at === null && $this->blocked_until !== null && $this->blocked_until->isFuture();

        return [
            'role_key' => $this->role_key,
            'reason' => $this->reason,
            'blocked_until' => $this->blocked_until?->toDateString(),
            'active' => $active,
            'override_reason' => $this->override_reason,
            'overridden_at' => $this->overridden_at?->toIso8601String(),
            'overridden_by' => $this->whenLoaded('overrider', fn () => $this->overrider?->name),
            'source_application' => $this->whenLoaded('sourceApplication', fn () => $this->sourceApplication?->public_id),
        ];
    }
}
