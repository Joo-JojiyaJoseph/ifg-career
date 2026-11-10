<?php

namespace App\Http\Requests\Hr;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SavedFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $required = $this->isMethod('POST') ? 'required' : 'sometimes';

        return [
            'screen' => [$required, 'string', 'max:40', Rule::in(['jobs', 'candidates', 'applications'])],
            'name' => [$required, 'string', 'max:80'],
            'query' => [$required, 'array'],
            'is_default' => ['sometimes', 'boolean'],
            'is_shared' => ['sometimes', 'boolean'],
        ];
    }
}
