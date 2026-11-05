<?php

namespace Database\Seeders;

use App\Enums\TalentSource;
use App\Models\Candidate;
use App\Models\TalentMember;
use Illuminate\Database\Seeder;

class TalentMemberSeeder extends Seeder
{
    public function run(): void
    {
        Candidate::query()->orderBy('id')->each(function (Candidate $candidate): void {
            TalentMember::query()->updateOrCreate(
                ['email' => $candidate->email],
                [
                    'name' => $candidate->name,
                    'phone' => $candidate->phone,
                    'candidate_id' => $candidate->id,
                    'source' => $candidate->signup_source->value === 'quick_apply'
                        ? TalentSource::QuickApply
                        : TalentSource::Signin,
                    'is_subscribed' => true,
                    'privacy_consent_at' => $candidate->privacy_consent_at,
                ],
            );
        });

        foreach (range(1, 8) as $index) {
            TalentMember::query()->updateOrCreate(
                ['email' => sprintf('community%02d@example.com', $index)],
                [
                    'name' => 'Community Member '.$index,
                    'phone' => '+9197'.str_pad((string) $index, 8, '0', STR_PAD_LEFT),
                    'source' => TalentSource::SignupForm,
                    'is_subscribed' => $index !== 8,
                    'unsubscribed_at' => $index === 8 ? now()->subDay() : null,
                    'privacy_consent_at' => now()->subDays(3),
                ],
            );
        }
    }
}
