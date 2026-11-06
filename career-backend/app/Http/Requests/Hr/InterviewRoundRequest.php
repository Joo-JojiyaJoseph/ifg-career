<?php

namespace App\Http\Requests\Hr;

use App\Enums\InterviewMode;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class InterviewRoundRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $creating = $this->isMethod('post');
        $required = $creating ? 'required' : 'sometimes';

        return [
            'round_name' => [$required, 'string', 'max:100'],
            'scheduled_at' => [$required, 'date', $creating ? 'after:now' : 'after:-1 day'],
            'duration_minutes' => ['nullable', 'integer', 'min:15', 'max:480'],
            'mode' => [$required, Rule::enum(InterviewMode::class)],
            'location_or_link' => [
                'nullable',
                'string',
                'max:255',
                Rule::requiredIf(fn () => in_array($this->input('mode'), ['video', 'in_person'], true)),
            ],
            'interviewer_name' => [$required, 'string', 'max:100'],
            'interviewer_email' => ['nullable', 'email:rfc', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'scheduled_at.after' => 'Choose a date and time in the future.',
            'location_or_link.required' => 'Add the meeting link or the interview location.',
        ];
    }
}
