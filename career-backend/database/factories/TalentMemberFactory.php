<?php

namespace Database\Factories;

use App\Enums\TalentSource;
use App\Models\TalentMember;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<TalentMember> */
class TalentMemberFactory extends Factory
{
    protected $model = TalentMember::class;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'phone' => '+9198'.fake()->numerify('########'),
            'source' => TalentSource::SignupForm,
            'is_subscribed' => true,
            'privacy_consent_at' => now(),
        ];
    }
}
