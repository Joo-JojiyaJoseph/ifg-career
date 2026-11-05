<?php

namespace Database\Factories;

use App\Models\SavedFilter;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<SavedFilter> */
class SavedFilterFactory extends Factory
{
    protected $model = SavedFilter::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'screen' => 'candidates',
            'name' => 'Open applications',
            'query' => ['status' => 'applied'],
            'is_default' => false,
            'is_shared' => false,
        ];
    }
}
