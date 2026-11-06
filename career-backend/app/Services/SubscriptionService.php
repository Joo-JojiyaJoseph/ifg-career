<?php

namespace App\Services;

use App\Models\TalentMember;

class SubscriptionService
{
    public function find(string $token): ?TalentMember
    {
        if (! preg_match('/^[A-Za-z0-9]{20,64}$/', $token)) {
            return null;
        }

        return TalentMember::query()->where('unsubscribe_token', $token)->first();
    }

    public function unsubscribe(TalentMember $member): TalentMember
    {
        if ($member->is_subscribed) {
            $member->forceFill(['is_subscribed' => false, 'unsubscribed_at' => now()])->save();
        }

        return $member;
    }

    public function resubscribe(TalentMember $member): TalentMember
    {
        if (! $member->is_subscribed) {
            $member->forceFill(['is_subscribed' => true, 'unsubscribed_at' => null, 'subscribed_at' => now()])->save();
        }

        return $member;
    }
}
