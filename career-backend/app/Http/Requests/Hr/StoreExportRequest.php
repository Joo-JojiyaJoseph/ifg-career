<?php

namespace App\Http\Requests\Hr;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreExportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type' => ['required', Rule::in(['candidates', 'applications', 'talent_members'])],
            'filters' => ['nullable', 'array'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function exportFilters(): array
    {
        $filters = $this->validated('filters') ?? [];

        unset($filters['page'], $filters['per_page']);

        return $filters;
    }
}
