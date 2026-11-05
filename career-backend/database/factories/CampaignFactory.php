<?php

namespace Database\Factories;

use App\Enums\CampaignStatus;
use App\Enums\CampaignType;
use App\Models\Campaign;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Campaign> */
class CampaignFactory extends Factory
{
    protected $model = Campaign::class;

    public function definition(): array
    {
        return [
            'type' => CampaignType::JobAlert,
            'subject' => 'New openings at Infolks Group',
            'body' => '<p>Hello, here are new roles across the group.</p>',
            'status' => CampaignStatus::Draft,
        ];
    }
}
