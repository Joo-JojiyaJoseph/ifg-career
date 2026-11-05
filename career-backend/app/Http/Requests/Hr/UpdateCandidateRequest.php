<?php

namespace App\Http\Requests\Hr;

use App\Enums\ColourTag;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCandidateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'colour_tag' => ['required', Rule::enum(ColourTag::class)],
        ];
    }
}
