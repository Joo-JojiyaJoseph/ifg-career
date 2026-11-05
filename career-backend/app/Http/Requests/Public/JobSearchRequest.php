<?php

namespace App\Http\Requests\Public;

use App\Enums\JobLevel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class JobSearchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('skills'))) {
            $this->merge([
                'skills' => array_values(array_filter(explode(',', $this->input('skills')))),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'q' => ['nullable', 'string', 'max:120'],
            'entity' => ['nullable', 'string', 'max:50'],
            'department' => ['nullable', 'integer'],
            'team' => ['nullable', 'integer'],
            'level' => ['nullable', Rule::enum(JobLevel::class)],
            'location' => ['nullable', 'string', 'max:120'],
            'skills' => ['nullable', 'array'],
            'skills.*' => ['string', 'max:80'],
            'posted' => ['nullable', Rule::in(['24h', '7d', '30d'])],
            'closing_soon' => ['nullable', 'boolean'],
            'sort' => ['nullable', Rule::in(['newest', 'closing', 'title'])],
            'cursor' => ['nullable', 'string'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:24'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function filters(): array
    {
        return [
            'search' => $this->validated('q'),
            'entity' => $this->validated('entity'),
            'department_id' => $this->validated('department'),
            'team_id' => $this->validated('team'),
            'level' => $this->validated('level'),
            'location' => $this->validated('location'),
            'skills' => $this->validated('skills') ?? [],
            'posted' => $this->validated('posted'),
            'closing_soon' => $this->boolean('closing_soon'),
            'sort' => $this->validated('sort') ?? 'newest',
        ];
    }
}
