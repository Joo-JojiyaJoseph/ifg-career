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
                'motto' => 'Accurate annotations for actionable insights',
                'short_description' => 'A leading data labeling service provider. Fully managed image, video, text, audio and LiDAR annotation that turns raw data into training data for AI and machine learning.',
                'primary_color' => '#1976D2',
                'secondary_color' => '#0B4FA3',
                'accent_color' => '#1E88E5',
                'website_url' => 'https://infolks.info',
                'sort_order' => 1,
            ],
            [
                'name' => 'Webfolks',
                'slug' => 'webfolks',
                'motto' => 'One stop for web and software',
                'short_description' => 'One stop solution for all web and software requirements: websites, web apps, mobile apps and custom software, from design to launch.',
                'primary_color' => '#0F766E',
                'secondary_color' => '#115E59',
                'accent_color' => '#14B8A6',
                'website_url' => 'https://webfolks.in',
                'sort_order' => 2,
            ],
            [
                'name' => 'Dataways',
                'slug' => 'dataways',
                'motto' => 'Your quest for AI data ends here',
                'short_description' => 'An AI data collection platform. Image, video, audio, text and 3D point cloud datasets collected and prepared for training and testing machine learning models.',
                'primary_color' => '#6D28D9',
                'secondary_color' => '#4C1D95',
                'accent_color' => '#8B5CF6',
                'website_url' => 'https://dataways.ai',
                'sort_order' => 3,
            ],
            [
                'name' => 'Medrays',
                'slug' => 'medrays',
                'motto' => 'Medical data labeling, led by doctors',
                'short_description' => 'An exclusive platform for medical data labeling. A panel of expert doctors labels complex medical data at any volume and builds training datasets for healthcare AI.',
                'primary_color' => '#0E7490',
                'secondary_color' => '#155E75',
                'accent_color' => '#06B6D4',
                'website_url' => 'https://medrays.ai',
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
