<?php

namespace App\Http\Resources;

use App\Models\Campaign;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Campaign */
class CampaignResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $total = max(1, (int) $this->recipient_count);

        return [
            'public_id' => $this->public_id,
            'type' => InterviewRoundResource::enum($this->type),
            'subject' => $this->subject,
            'body' => $this->body,
            'status' => InterviewRoundResource::enum($this->status),
            'recipient_count' => $this->recipient_count,
            'sent_count' => $this->sent_count,
            'failed_count' => $this->failed_count,
            'progress' => $this->recipient_count ? (int) floor((($this->sent_count + $this->failed_count) / $total) * 100) : 0,
            'sent_by' => $this->whenLoaded('sender', fn () => $this->sender?->name),
            'started_at' => $this->started_at?->toIso8601String(),
            'finished_at' => $this->finished_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'jobs' => $this->whenLoaded('jobPostings', fn () => $this->jobPostings->map(fn ($job) => [
                'public_id' => $job->public_id,
                'title' => $job->title,
            ])->values()),
        ];
    }
}
