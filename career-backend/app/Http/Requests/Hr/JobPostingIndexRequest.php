<?php

namespace App\Http\Requests\Hr;

use App\Enums\JobLevel;
use App\Enums\JobStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class JobPostingIndexRequest extends FormRequest
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
            'status' => ['nullable', Rule::enum(JobStatus::class)],
            'skills' => ['nullable', 'array'],
            'skills.*' => ['string', 'max:80'],
            'created_by' => ['nullable', 'string', 'max:255'],
            'posted_from' => ['nullable', 'date'],
            'posted_to' => ['nullable', 'date'],
            'last_date_from' => ['nullable', 'date'],
            'last_date_to' => ['nullable', 'date'],
            'closing_within' => ['nullable', 'integer', 'min:1', 'max:365'],
            'has_applications' => ['nullable', 'boolean'],
            'sort' => ['nullable', Rule::in(['posted_at', 'title', 'closing', 'applications', 'status'])],
            'direction' => ['nullable', Rule::in(['asc', 'desc'])],
            'per_page' => ['nullable', Rule::in([25, 50, 100])],
            'page' => ['nullable', 'integer', 'min:1'],
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
            'status' => $this->validated('status'),
            'skills' => $this->validated('skills') ?? [],
            'created_by' => $this->validated('created_by'),
            'posted_from' => $this->validated('posted_from'),
            'posted_to' => $this->validated('posted_to'),
            'last_date_from' => $this->validated('last_date_from'),
            'last_date_to' => $this->validated('last_date_to'),
            'closing_within' => $this->validated('closing_within'),
            'has_applications' => $this->validated('has_applications'),
            'sort' => $this->validated('sort') ?? 'posted_at',
            'direction' => $this->validated('direction') ?? 'desc',
        ];
    }
}
