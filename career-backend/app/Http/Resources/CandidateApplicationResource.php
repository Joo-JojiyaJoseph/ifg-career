<?php

namespace App\Http\Resources;

use App\Enums\ApplicationType;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CandidateApplicationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $snapshot = $this->snapshot ?? [];
        $department = $snapshot['department_name'] ?? $this->department?->name;
        $role = $this->type === ApplicationType::General
            ? 'General application – '.($department ?: 'department')
            : ($snapshot['job_title'] ?? $this->jobPosting?->title ?? 'Application');

        return [
            'public_id' => $this->public_id,
            'type' => $this->type?->value,
            'role' => $role,
            'entity' => $this->entity ? [
                'name' => $this->entity->name,
                'slug' => $this->entity->slug,
                'theme' => [
                    'accent' => $this->entity->accent_color,
                ],
            ] : null,
            'applied_at' => $this->applied_at?->toDateString(),
            'status' => $this->candidateStatusCode(),
        ];
    }
}
