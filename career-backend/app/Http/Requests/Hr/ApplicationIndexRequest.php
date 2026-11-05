<?php

namespace App\Http\Requests\Hr;

use App\Enums\ApplicationResult;
use App\Enums\ApplicationSource;
use App\Enums\ApplicationStatus;
use App\Enums\ApplicationType;
use App\Enums\JobLevel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ApplicationIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        foreach (['referred', 'has_interview', 'flagged'] as $key) {
            if ($this->input($key) === '') {
                $this->merge([$key => null]);
            }
        }
    }

    public function rules(): array
    {
        return [
            'q' => ['nullable', 'string', 'max:120'],
            'type' => ['nullable', Rule::enum(ApplicationType::class)],
            'entity' => ['nullable', 'string', 'max:50'],
            'job' => ['nullable', 'string', 'max:180'],
            'candidate' => ['nullable', 'string', 'max:26'],
            'department' => ['nullable', 'integer'],
            'level' => ['nullable', Rule::enum(JobLevel::class)],
            'source' => ['nullable', Rule::enum(ApplicationSource::class)],
            'referred' => ['nullable', 'boolean'],
            'status' => ['nullable', Rule::enum(ApplicationStatus::class)],
            'result' => ['nullable', Rule::enum(ApplicationResult::class)],
            'applied_from' => ['nullable', 'date'],
            'applied_to' => ['nullable', 'date'],
            'has_interview' => ['nullable', 'boolean'],
            'flagged' => ['nullable', 'boolean'],
            'sort' => ['nullable', Rule::in(['applied_at', 'status', 'candidate'])],
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
            'type' => $this->validated('type'),
            'entity' => $this->validated('entity'),
            'job' => $this->validated('job'),
            'candidate' => $this->validated('candidate'),
            'department_id' => $this->validated('department'),
            'level' => $this->validated('level'),
            'source' => $this->validated('source'),
            'referred' => $this->validated('referred'),
            'status' => $this->validated('status'),
            'result' => $this->validated('result'),
            'applied_from' => $this->validated('applied_from'),
            'applied_to' => $this->validated('applied_to'),
            'has_interview' => $this->validated('has_interview'),
            'flagged' => $this->validated('flagged'),
            'sort' => $this->validated('sort') ?? 'applied_at',
            'direction' => $this->validated('direction') ?? 'desc',
        ];
    }
}
