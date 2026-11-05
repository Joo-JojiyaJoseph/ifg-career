<?php

namespace Database\Factories;

use App\Enums\EmailType;
use App\Models\EmailLog;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<EmailLog> */
class EmailLogFactory extends Factory
{
    protected $model = EmailLog::class;

    public function definition(): array
    {
        return [
            'type' => EmailType::ApplicationConfirmation,
            'recipient_email' => fake()->safeEmail(),
            'status' => 'queued',
        ];
    }
}
