<?php

namespace App\Http\Requests\Hr;

use App\Enums\JobLevel;
use App\Models\Team;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class JobPostingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $creating = $this->isMethod('POST');

        return [
            'title' => [$creating ? 'required' : 'sometimes', 'string', 'max:150'],
            'role_key' => ['nullable', 'string', 'max:150'],
            'entity' => [$creating ? 'required' : 'sometimes', 'nullable', 'string', 'exists:entities,slug'],
            'department_id' => ['nullable', 'integer', 'exists:departments,id'],
            'team_id' => ['nullable', 'integer', 'exists:teams,id'],
            'level' => [$creating ? 'required' : 'sometimes', 'nullable', Rule::enum(JobLevel::class)],
            'location' => [$creating ? 'required' : 'sometimes', 'nullable', 'string', 'max:120'],
            'summary' => [$creating ? 'required' : 'sometimes', 'nullable', 'string'],
            'qualification' => [$creating ? 'required' : 'sometimes', 'nullable', 'string'],
            'experience' => [$creating ? 'required' : 'sometimes', 'nullable', 'string', 'max:150'],
            'why_join_us' => ['nullable', 'string'],
            'last_date_to_apply' => [$creating ? 'required' : 'sometimes', 'nullable', 'date'],
            'skills' => ['nullable', 'array'],
            'skills.*' => ['string', 'exists:skills,slug'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            if (! $this->filled('team_id') || ! $this->filled('department_id')) {
                return;
            }

            $team = Team::query()->find($this->integer('team_id'));
            if ($team && $team->department_id && (int) $team->department_id !== $this->integer('department_id')) {
                $validator->errors()->add('team_id', 'Choose a team in that department.');
            }
        });
    }
}
