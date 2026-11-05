<?php

namespace App\Http\Requests\Hr;

use App\Enums\ApplicationStatus;
use App\Enums\ColourTag;
use App\Enums\Gender;
use App\Enums\SignupSource;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CandidateIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        foreach (['blacklisted', 'has_referral', 'has_role_block', 'profile_complete'] as $key) {
            if ($this->input($key) === '') {
                $this->merge([$key => null]);
            }
        }
    }

    public function rules(): array
    {
        return [
            'q' => ['nullable', 'string', 'max:120'],
            'entity' => ['nullable', 'string', 'max:50'],
            'role' => ['nullable', 'string', 'max:150'],
            'department' => ['nullable', 'integer'],
            'gender' => ['nullable', Rule::enum(Gender::class)],
            'age_min' => ['nullable', 'integer', 'min:0', 'max:100'],
            'age_max' => ['nullable', 'integer', 'min:0', 'max:100'],
            'location' => ['nullable', 'string', 'max:120'],
            'qualification' => ['nullable', 'string', 'max:150'],
            'experience_min' => ['nullable', 'numeric', 'min:0', 'max:80'],
            'experience_max' => ['nullable', 'numeric', 'min:0', 'max:80'],
            'ctc_min' => ['nullable', 'numeric', 'min:0'],
            'ctc_max' => ['nullable', 'numeric', 'min:0'],
            'signup_source' => ['nullable', Rule::enum(SignupSource::class)],
            'colour_tag' => ['nullable', Rule::enum(ColourTag::class)],
            'blacklisted' => ['nullable', 'boolean'],
            'has_referral' => ['nullable', 'boolean'],
            'has_role_block' => ['nullable', 'boolean'],
            'application_status' => ['nullable', Rule::enum(ApplicationStatus::class)],
            'applied_from' => ['nullable', 'date'],
            'applied_to' => ['nullable', 'date'],
            'profile_complete' => ['nullable', 'boolean'],
            'sort' => ['nullable', Rule::in(['name', 'experience', 'applied_at'])],
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
            'role' => $this->validated('role'),
            'department_id' => $this->validated('department'),
            'gender' => $this->validated('gender'),
            'age_min' => $this->validated('age_min'),
            'age_max' => $this->validated('age_max'),
            'location' => $this->validated('location'),
            'qualification' => $this->validated('qualification'),
            'experience_min' => $this->validated('experience_min'),
            'experience_max' => $this->validated('experience_max'),
            'ctc_min' => $this->validated('ctc_min'),
            'ctc_max' => $this->validated('ctc_max'),
            'signup_source' => $this->validated('signup_source'),
            'colour_tag' => $this->validated('colour_tag'),
            'blacklisted' => $this->validated('blacklisted'),
            'has_referral' => $this->validated('has_referral'),
            'has_role_block' => $this->validated('has_role_block'),
            'application_status' => $this->validated('application_status'),
            'applied_from' => $this->validated('applied_from'),
            'applied_to' => $this->validated('applied_to'),
            'profile_complete' => $this->validated('profile_complete'),
            'sort' => $this->validated('sort') ?? 'name',
            'direction' => $this->validated('direction') ?? 'asc',
        ];
    }
}
