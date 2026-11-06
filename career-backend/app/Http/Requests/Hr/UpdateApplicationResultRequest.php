<?php

namespace App\Http\Requests\Hr;

use App\Enums\ApplicationResult;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateApplicationResultRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'result' => ['required', Rule::enum(ApplicationResult::class)],
        ];
    }
}
