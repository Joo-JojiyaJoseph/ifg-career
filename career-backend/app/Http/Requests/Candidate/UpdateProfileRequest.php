<?php

namespace App\Http\Requests\Candidate;

use App\Enums\Gender;
use App\Rules\AgeBetween;
use App\Rules\PhoneNumber;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user('candidate') !== null;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'linkedin_url' => $this->filled('linkedin_url') ? $this->input('linkedin_url') : null,
            'portfolio_url' => $this->filled('portfolio_url') ? $this->input('portfolio_url') : null,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:100'],
            'date_of_birth' => ['required', 'date', 'before:today', new AgeBetween],
            'phone' => ['required', 'string', 'max:20', new PhoneNumber],
            'location' => ['required', 'string', 'max:255'],
            'gender' => ['required', Rule::enum(Gender::class)],
            'highest_qualification' => ['required', 'string', 'max:255'],
            'preferred_department_id' => ['required', 'integer', 'exists:departments,id'],
            'years_experience' => ['required', 'numeric', 'min:0', 'max:80'],
            'current_ctc' => ['required', 'numeric', 'min:0'],
            'expected_ctc' => ['required', 'numeric', 'min:0'],
            'linkedin_url' => ['nullable', 'url', 'max:255'],
            'portfolio_url' => ['nullable', 'url', 'max:255'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Enter your name.',
            'name.min' => 'Use at least 2 characters.',
            'date_of_birth.required' => 'Enter your date of birth.',
            'date_of_birth.date' => 'Enter a valid date.',
            'date_of_birth.before' => 'Enter a past date.',
            'phone.required' => 'Enter your phone number.',
            'location.required' => 'Enter your city and country.',
            'gender.required' => 'Choose a gender.',
            'highest_qualification.required' => 'Enter your highest qualification.',
            'preferred_department_id.required' => 'Choose a department.',
            'preferred_department_id.exists' => 'Choose a department from the list.',
            'years_experience.required' => 'Enter your years of experience.',
            'years_experience.min' => 'Years of experience cannot be negative.',
            'current_ctc.required' => 'Enter your current CTC.',
            'current_ctc.min' => 'Current CTC cannot be negative.',
            'expected_ctc.required' => 'Enter your expected CTC.',
            'expected_ctc.min' => 'Expected CTC cannot be negative.',
            'linkedin_url.url' => 'Enter a valid LinkedIn URL.',
            'portfolio_url.url' => 'Enter a valid portfolio URL.',
        ];
    }
}
