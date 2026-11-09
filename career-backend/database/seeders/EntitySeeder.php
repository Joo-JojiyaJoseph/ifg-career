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
                'photo_path' => Photos::INFOLKS_TEAM,
                'primary_color' => '#2F4BD8',
                'secondary_color' => '#141F6B',
                'accent_color' => '#22C7F0',
                'website_url' => 'https://infolks.info',
                'sort_order' => 1,
            ],
            [
                'name' => 'Webfolks',
                'slug' => 'webfolks',
                'motto' => 'Digital Marketing and IT Solutions',
                'short_description' => 'Turn creative ideas into meaningful work through technology, design, and digital innovation.',
                'photo_path' => '/images/companies/webfolks.svg',
                'primary_color' => '#D9182D',
                'secondary_color' => '#0B0507',
                'accent_color' => '#FF3B4E',
                'website_url' => 'https://webfolks.in',
                'sort_order' => 3,
            ],
            [
                'name' => 'Dataways',
                'slug' => 'dataways',
                'motto' => 'Data Collection Company',
                'short_description' => 'Be part of a team where precision, expertise, and attention to detail shape quality data solutions.',
                'photo_path' => '/images/companies/dataways.svg',
                'primary_color' => '#3B33D6',
                'secondary_color' => '#0A0742',
                'accent_color' => '#00CFFF',
                'website_url' => 'https://dataways.ai',
                'sort_order' => 4,
            ],
            [
                'name' => 'Medrays',
                'slug' => 'medrays',
                'motto' => 'Medical Data Annotation Services',
                'short_description' => 'Contribute to healthcare AI through accurate medical data annotation and work that matters beyond the workplace.',
                'photo_path' => '/images/companies/medrays.svg',
                'primary_color' => '#0B6E99',
                'secondary_color' => '#061C3F',
                'accent_color' => '#3CD0E8',
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
