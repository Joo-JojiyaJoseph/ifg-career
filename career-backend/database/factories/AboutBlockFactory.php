<?php

namespace Database\Factories;

use App\Models\AboutBlock;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<AboutBlock> */
class AboutBlockFactory extends Factory
{
    protected $model = AboutBlock::class;

    public function definition(): array
    {
        return [
            'title' => 'How we work',
            'body' => 'Teams across Infolks Group collaborate in the open.',
            'heroicon_name' => 'UserGroupIcon',
            'sort_order' => 1,
            'is_published' => true,
        ];
    }
}
