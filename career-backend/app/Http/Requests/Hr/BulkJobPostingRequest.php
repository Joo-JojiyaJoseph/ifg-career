<?php

namespace App\Http\Requests\Hr;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BulkJobPostingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'action' => ['required', Rule::in(['publish', 'unpublish', 'close'])],
            'ids' => ['required', 'array', 'min:1', 'max:100'],
            'ids.*' => ['string', 'size:26'],
        ];
    }
}
