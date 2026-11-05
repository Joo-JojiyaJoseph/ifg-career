<?php

namespace Database\Factories;

use App\Models\EmployeeStory;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<EmployeeStory> */
class EmployeeStoryFactory extends Factory
{
    protected $model = EmployeeStory::class;

    public function definition(): array
    {
        return [
            'name' => 'Ananya Rao',
            'role' => 'Software Engineer',
            'quote' => 'I get to learn with people from every entity in the group.',
            'publish_permission_confirmed' => true,
            'sort_order' => 1,
            'is_published' => true,
            'photo_path' => '/images/placeholders/story.svg',
        ];
    }
}
