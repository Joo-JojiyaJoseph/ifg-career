<?php

namespace App\Http\Controllers\Candidate;

use App\Enums\TalentSource;
use App\Http\Controllers\Controller;
use App\Http\Requests\Candidate\SubscriptionRequest;
use App\Http\Resources\CandidateResource;
use App\Models\TalentMember;

class SubscriptionController extends Controller
{
    public function update(SubscriptionRequest $request): CandidateResource
    {
        $candidate = $request->user('candidate');
        $subscribed = $request->boolean('is_subscribed');
        $member = TalentMember::query()->firstOrNew(['email' => $candidate->email]);

        $member->fill([
            'name' => $candidate->name,
            'phone' => $candidate->phone,
            'candidate_id' => $candidate->id,
            'is_subscribed' => $subscribed,
            'unsubscribed_at' => $subscribed ? null : now(),
            'privacy_consent_at' => $member->privacy_consent_at ?? $candidate->privacy_consent_at ?? now(),
        ]);

        if (! $member->exists) {
            $member->source = TalentSource::Signin;
        }

        if ($subscribed) {
            $member->subscribed_at ??= now();
        }

        $member->save();

        return new CandidateResource($candidate->fresh()->load(['talentMember', 'preferredDepartment']));
    }
}
