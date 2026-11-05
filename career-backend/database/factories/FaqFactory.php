<?php

namespace Database\Factories;

use App\Models\Faq;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Faq> */
class FaqFactory extends Factory
{
    protected $model = Faq::class;

    public function definition(): array
    {
        return [
            'question' => 'How do I apply?',
            'answer' => '<p>Sign in with Google and submit the form on the job page.</p>',
            'sort_order' => 1,
            'is_published' => true,
        ];
    }
}
