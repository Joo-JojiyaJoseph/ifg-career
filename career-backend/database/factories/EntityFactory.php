<?php

namespace Database\Factories;

use App\Models\Entity;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Entity>
 */
class EntityFactory extends Factory
{
    protected $model = Entity::class;

    public function definition(): array
    {
        $name = 'Entity '.fake()->unique()->numerify('#####');

        return [
            'name' => $name,
            'slug' => Str::slug($name),
            'motto' => 'Building useful products',
            'short_description' => 'An entity of Infolks Group.',
            'primary_color' => '#1976D2',
            'secondary_color' => '#0B4FA3',
            'accent_color' => '#1E88E5',
            'sort_order' => 0,
            'is_active' => true,
        ];
    }
}
