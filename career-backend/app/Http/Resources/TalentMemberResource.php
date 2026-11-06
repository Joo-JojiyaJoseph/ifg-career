<?php

namespace App\Http\Resources;

use App\Models\TalentMember;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin TalentMember */
class TalentMemberResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'source' => InterviewRoundResource::enum($this->source),
            'is_subscribed' => $this->is_subscribed,
            'subscribed_at' => $this->subscribed_at?->toIso8601String(),
            'unsubscribed_at' => $this->unsubscribed_at?->toIso8601String(),
            'candidate' => $this->whenLoaded('candidate', fn () => $this->candidate ? [
                'public_id' => $this->candidate->public_id,
                'name' => $this->candidate->name,
            ] : null),
        ];
    }
}
