<?php

namespace Database\Factories;

use App\Models\Recognition;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Recognition> */
class RecognitionFactory extends Factory
{
    protected $model = Recognition::class;

    public function definition(): array
    {
        return [
            'name' => 'Great Place to Work',
            'year' => 2025,
            'badge_path' => '/images/placeholders/badge.svg',
            'sort_order' => 1,
            'is_published' => true,
        ];
    }
}
