<?php

namespace App\Http\Requests\Hr;

use App\Enums\CalendarSyncStatus;
use App\Enums\InterviewMode;
use App\Enums\RoundStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class InterviewIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'view' => ['nullable', Rule::in(['list', 'calendar'])],
            'q' => ['nullable', 'string', 'max:120'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'when' => ['nullable', Rule::in(['today', 'week', 'upcoming', 'past'])],
            'entity' => ['nullable', 'string', 'max:50'],
            'job' => ['nullable', 'string', 'max:180'],
            'department' => ['nullable', 'integer'],
            'candidate' => ['nullable', 'string', 'max:26'],
            'interviewer' => ['nullable', 'string', 'max:150'],
            'mode' => ['nullable', Rule::enum(InterviewMode::class)],
            'status' => ['nullable', Rule::enum(RoundStatus::class)],
            'sync' => ['nullable', Rule::enum(CalendarSyncStatus::class)],
            'round' => ['nullable', 'string', 'max:26'],
            'sort' => ['nullable', Rule::in(['scheduled_at', 'status', 'interviewer'])],
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
            'from' => $this->validated('from'),
            'to' => $this->validated('to'),
            'when' => $this->validated('when'),
            'entity' => $this->validated('entity'),
            'job' => $this->validated('job'),
            'department_id' => $this->validated('department'),
            'candidate' => $this->validated('candidate'),
            'interviewer' => $this->validated('interviewer'),
            'mode' => $this->validated('mode'),
            'status' => $this->validated('status'),
            'sync' => $this->validated('sync'),
            'round' => $this->validated('round'),
            'sort' => $this->validated('sort') ?? 'scheduled_at',
            'direction' => $this->validated('direction') ?? 'asc',
        ];
    }
}
