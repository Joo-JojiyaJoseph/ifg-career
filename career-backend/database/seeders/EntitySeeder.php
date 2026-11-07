<?php

namespace Database\Seeders;

use App\Models\Entity;
use Database\Seeders\Support\Photos;
use Illuminate\Database\Seeder;

class EntitySeeder extends Seeder
{
    public function run(): void
    {
        $entities = [
            [
                'name' => 'Infolks',
                'slug' => 'infolks',
                'motto' => 'AI Data Annotation Company',
                'short_description' => 'Bring your strengths, share your ideas, and grow with a team that values your contribution.',
                'photo_path' => Photos::url('1758873268394-443e1ac80032'),
                'primary_color' => '#1976D2',
                'secondary_color' => '#0B4FA3',
                'accent_color' => '#1E88E5',
                'website_url' => 'https://infolks.info',
                'sort_order' => 1,
            ],
            [
                'name' => 'Webfolks',
                'slug' => 'webfolks',
                'motto' => 'Digital Marketing and IT Solutions',
                'short_description' => 'Turn creative ideas into meaningful work through technology, design, and digital innovation.',
                'photo_path' => Photos::url('1686061593213-98dad7c599b9'),
                'primary_color' => '#0F766E',
                'secondary_color' => '#115E59',
                'accent_color' => '#14B8A6',
                'website_url' => 'https://webfolks.in',
                'sort_order' => 3,
            ],
            [
                'name' => 'Dataways',
                'slug' => 'dataways',
                'motto' => 'Data Collection Company',
                'short_description' => 'Be part of a team where precision, expertise, and attention to detail shape quality data solutions.',
                'photo_path' => Photos::url('1653669485217-74da3d8e71c6'),
                'primary_color' => '#6D28D9',
                'secondary_color' => '#4C1D95',
                'accent_color' => '#8B5CF6',
                'website_url' => 'https://dataways.ai',
                'sort_order' => 4,
            ],
            [
                'name' => 'Medrays',
                'slug' => 'medrays',
                'motto' => 'Medical Data Annotation Services',
                'short_description' => 'Contribute to healthcare AI through accurate medical data annotation and work that matters beyond the workplace.',
                'photo_path' => Photos::url('1758691461957-13aff0c37c6f'),
                'primary_color' => '#0E7490',
                'secondary_color' => '#155E75',
                'accent_color' => '#06B6D4',
                'website_url' => 'https://medrays.ai',
                'sort_order' => 2,
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
