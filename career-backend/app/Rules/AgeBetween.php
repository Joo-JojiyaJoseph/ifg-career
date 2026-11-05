<?php

namespace App\Rules;

use Carbon\Carbon;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class AgeBetween implements ValidationRule
{
    public function __construct(private int $min = 16, private int $max = 70) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        try {
            $age = Carbon::parse($value)->age;
        } catch (\Throwable) {
            $fail('Enter a valid date.');

            return;
        }

        if ($age < $this->min || $age > $this->max) {
            $fail('Enter a date of birth for someone aged 16 to 70.');
        }
    }
}
