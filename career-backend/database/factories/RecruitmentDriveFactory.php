<?php

namespace Database\Factories;

use App\Models\RecruitmentDrive;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<RecruitmentDrive> */
class RecruitmentDriveFactory extends Factory
{
    protected $model = RecruitmentDrive::class;

    public function definition(): array
    {
        return [
            'name' => 'Campus drive, Kochi',
            'drive_date' => now()->subMonths(2)->toDateString(),
            'caption' => 'Meeting students at a campus drive.',
            'photo_path' => '/images/placeholders/drive.svg',
            'sort_order' => 1,
            'is_published' => true,
        ];
    }
}
