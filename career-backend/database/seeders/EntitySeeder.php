<?php

namespace Database\Seeders;

use App\Models\Entity;
use Illuminate\Database\Seeder;

class EntitySeeder extends Seeder
{
    public function run(): void
    {
        $entities = [
            [
                'name' => 'Infolks',
                'slug' => 'infolks',
                'motto' => 'Software that people rely on',
                'short_description' => 'Product engineering for web and mobile platforms used by teams across India.',
                'primary_color' => '#1976D2',
                'secondary_color' => '#0B4FA3',
                'accent_color' => '#1E88E5',
                'website_url' => null,
                'sort_order' => 1,
            ],
            [
                'name' => 'Webfolks',
                'slug' => 'webfolks',
                'motto' => 'Web experiences, built with care',
                'short_description' => 'Design and front-end engineering for clear, fast websites and web apps.',
                'primary_color' => '#0F766E',
                'secondary_color' => '#115E59',
                'accent_color' => '#14B8A6',
                'website_url' => null,
                'sort_order' => 2,
            ],
            [
                'name' => 'Dataways',
                'slug' => 'dataways',
                'motto' => 'Data, made useful',
                'short_description' => 'Data engineering, analytics and machine learning for operational teams.',
                'primary_color' => '#6D28D9',
                'secondary_color' => '#4C1D95',
                'accent_color' => '#8B5CF6',
                'website_url' => null,
                'sort_order' => 3,
            ],
            [
                'name' => 'Medrays',
                'slug' => 'medrays',
                'motto' => 'Imaging for better care',
                'short_description' => 'Medical imaging products and clinical workflow tools for healthcare teams.',
                'primary_color' => '#0E7490',
                'secondary_color' => '#155E75',
                'accent_color' => '#06B6D4',
                'website_url' => null,
                'sort_order' => 4,
            ],
        ];

        foreach ($entities as $entity) {
            Entity::query()->updateOrCreate(
                ['slug' => $entity['slug']],
                [...$entity, 'is_active' => true],
            );
        }
    }
}
