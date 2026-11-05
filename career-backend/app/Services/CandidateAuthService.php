<?php

namespace App\Services;

use App\Enums\SignupSource;
use App\Enums\TalentSource;
use App\Models\Candidate;
use App\Models\TalentMember;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Contracts\User as SocialiteUser;

class CandidateAuthService
{
    public function loginFromGoogle(SocialiteUser $googleUser): Candidate
    {
        $raw = $googleUser->user ?? [];
        $verified = (bool) ($raw['email_verified'] ?? $raw['verified_email'] ?? false);

        if (! $verified || blank($googleUser->getEmail())) {
            abort(403, 'Google did not confirm this email address.');
        }

        $email = mb_strtolower($googleUser->getEmail());
        $candidate = Candidate::query()->where('email', $email)->first();

        if ($candidate) {
            $candidate->forceFill([
                'google_id' => $googleUser->getId(),
                'avatar_url' => $candidate->avatar_url ?: $googleUser->getAvatar(),
                'email_verified_at' => $candidate->email_verified_at ?? now(),
                'last_login_at' => now(),
            ])->save();
        } else {
            $candidate = Candidate::query()->create([
                'google_id' => $googleUser->getId(),
                'avatar_url' => $googleUser->getAvatar(),
                'email' => $email,
                'email_verified_at' => now(),
                'name' => $googleUser->getName() ?: 'Candidate',
                'signup_source' => SignupSource::Google,
                'privacy_consent_at' => now(),
                'last_login_at' => now(),
            ]);
        }

        $member = TalentMember::query()->firstOrNew(['email' => $candidate->email]);
        $member->fill([
            'name' => $candidate->name,
            'phone' => $candidate->phone,
            'candidate_id' => $candidate->id,
        ]);

        if (! $member->exists) {
            $member->source = $candidate->signup_source === SignupSource::QuickApply
                ? TalentSource::QuickApply
                : TalentSource::Signin;
            $member->is_subscribed = true;
            $member->privacy_consent_at = $candidate->privacy_consent_at ?? now();
        }

        $member->save();

        session()->regenerate();
        Auth::guard('candidate')->login($candidate, true);

        return $candidate;
    }
}
