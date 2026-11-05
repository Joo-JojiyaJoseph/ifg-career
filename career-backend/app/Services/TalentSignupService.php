<?php

namespace App\Services;

use App\Enums\TalentSource;
use App\Models\Candidate;
use App\Models\TalentMember;

class TalentSignupService
{
    /**
     * @param  array<string, mixed>  $input
     * @return array{message: string, code: string}
     */
    public function join(array $input): array
    {
        $email = mb_strtolower((string) $input['email']);
        $member = TalentMember::query()->firstOrNew(['email' => $email]);

        if ($member->exists && $member->is_subscribed) {
            return [
                'message' => "You're already a member of the talent community.",
                'code' => 'already_member',
            ];
        }

        $resubscribed = $member->exists;
        $candidate = Candidate::query()->where('email', $email)->first();

        $member->fill([
            'name' => $input['name'],
            'email' => $email,
            'phone' => $input['phone'],
            'candidate_id' => $candidate?->id,
            'is_subscribed' => true,
            'unsubscribed_at' => null,
            'privacy_consent_at' => now(),
            'subscribed_at' => now(),
        ]);

        if (! $resubscribed) {
            $member->source = TalentSource::SignupForm;
        }

        $member->save();

        if ($resubscribed) {
            return [
                'message' => "You're subscribed again. We'll email you about new openings.",
                'code' => 'resubscribed',
            ];
        }

        return [
            'message' => "You're in! We'll email you about new openings.",
            'code' => 'subscribed',
        ];
    }
}
