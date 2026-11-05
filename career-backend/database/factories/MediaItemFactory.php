<?php

namespace Database\Factories;

use App\Enums\MediaType;
use App\Models\MediaItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<MediaItem> */
class MediaItemFactory extends Factory
{
    protected $model = MediaItem::class;

    public function definition(): array
    {
        return [
            'type' => MediaType::Activity,
            'title' => 'Team day',
            'caption' => 'A day out with the Infolks Group team.',
            'photo_path' => '/images/placeholders/activity.svg',
            'sort_order' => 1,
            'is_published' => true,
        ];
    }
}
