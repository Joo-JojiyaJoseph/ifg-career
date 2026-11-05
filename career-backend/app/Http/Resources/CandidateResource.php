<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CandidateResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'public_id' => $this->public_id,
            'name' => $this->name,
            'email' => $this->email,
            'avatar_url' => $this->avatar_url,
            'initials' => $this->initials,
            'phone' => $this->phone,
            'location' => $this->location,
            'date_of_birth' => $this->date_of_birth?->toDateString(),
            'gender' => $this->gender?->value,
            'highest_qualification' => $this->highest_qualification,
            'preferred_department_id' => $this->preferred_department_id,
            'years_experience' => $this->years_experience !== null ? (float) $this->years_experience : null,
            'current_ctc' => $this->current_ctc !== null ? (float) $this->current_ctc : null,
            'expected_ctc' => $this->expected_ctc !== null ? (float) $this->expected_ctc : null,
            'linkedin_url' => $this->linkedin_url,
            'portfolio_url' => $this->portfolio_url,
            'resume_original_name' => $this->resume_original_name,
            'has_resume' => filled($this->resume_path),
            'profile_completion_percent' => $this->profile_completion_percent,
            'profile_completed_at' => $this->profile_completed_at,
            'signup_source' => $this->signup_source?->value,
            'talent_subscribed' => $this->relationLoaded('talentMember')
                ? (bool) $this->talentMember?->is_subscribed
                : false,
        ];
    }
}
