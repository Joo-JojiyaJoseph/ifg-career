<?php

namespace App\Http\Requests\Hr;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class InterviewPipelineRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'q' => ['nullable', 'string', 'max:120'],
            'stage' => ['nullable', Rule::in(['to_schedule', 'scheduled', 'awaiting_decision', 'selected', 'not_selected'])],
            'entity' => ['nullable', 'string', 'max:50'],
            'job' => ['nullable', 'string', 'max:180'],
            'department' => ['nullable', 'integer'],
            'candidate' => ['nullable', 'string', 'max:26'],
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
            'stage' => $this->validated('stage'),
            'entity' => $this->validated('entity'),
            'job' => $this->validated('job'),
            'department_id' => $this->validated('department'),
            'candidate' => $this->validated('candidate'),
        ];
    }
}
