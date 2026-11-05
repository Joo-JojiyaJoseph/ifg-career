<?php

namespace Database\Factories;

use App\Enums\ExportStatus;
use App\Models\Export;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Export> */
class ExportFactory extends Factory
{
    protected $model = Export::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'type' => 'candidates',
            'filters' => ['search' => ''],
            'status' => ExportStatus::Queued,
        ];
    }
}
