<?php

namespace App\Http\Requests\Candidate;

use Illuminate\Foundation\Http\FormRequest;

class ApplicationIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user('candidate') !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'status' => ['nullable', 'in:in_progress,applied,in_review,shortlisted,interview_scheduled,selected,not_selected,closed'],
            'entity' => ['nullable', 'string', 'max:50'],
            'applied_from' => ['nullable', 'date'],
            'applied_to' => ['nullable', 'date'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function filters(): array
    {
        return $this->safe()->only(['status', 'entity', 'applied_from', 'applied_to']);
    }
}
