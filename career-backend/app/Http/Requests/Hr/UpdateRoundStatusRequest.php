<?php

namespace App\Http\Requests\Hr;

use App\Enums\RoundStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRoundStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::enum(RoundStatus::class)],
            'feedback' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
