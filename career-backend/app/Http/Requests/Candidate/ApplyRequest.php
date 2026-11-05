<?php

namespace App\Http\Requests\Candidate;

use App\Enums\Gender;
use App\Rules\PhoneNumber;
use App\Support\ResumeRules;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ApplyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user('candidate') !== null;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'reference_id' => $this->filled('reference_id') ? $this->input('reference_id') : null,
            'linkedin_url' => $this->filled('linkedin_url') ? $this->input('linkedin_url') : null,
            'portfolio_url' => $this->filled('portfolio_url') ? $this->input('portfolio_url') : null,
            'save_to_profile' => $this->boolean('save_to_profile'),
            'src' => $this->input('src', $this->query('src')),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $resumeRequired = blank($this->user('candidate')?->resume_path);

        return [
            'name' => ['required', 'string', 'min:2', 'max:100'],
            'phone' => ['required', 'string', 'max:20', new PhoneNumber],
            'location' => ['required', 'string', 'max:255'],
            'gender' => ['required', Rule::enum(Gender::class)],
            'years_experience' => ['required', 'numeric', 'min:0', 'max:80'],
            'current_ctc' => ['required', 'numeric', 'min:0'],
            'expected_ctc' => ['required', 'numeric', 'min:0'],
            'reference_id' => ['nullable', 'string', 'max:50'],
            'resume' => ResumeRules::file($resumeRequired),
            'linkedin_url' => ['nullable', 'url', 'max:255'],
            'portfolio_url' => ['nullable', 'url', 'max:255'],
            'save_to_profile' => ['boolean'],
            'src' => ['nullable', 'string', 'max:30'],
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
            'phone.required' => 'Enter your phone number.',
            'location.required' => 'Enter your city and country.',
            'gender.required' => 'Choose a gender.',
            'years_experience.required' => 'Enter your years of experience.',
            'years_experience.min' => 'Years of experience cannot be negative.',
            'current_ctc.required' => 'Enter your current CTC.',
            'current_ctc.min' => 'Current CTC cannot be negative.',
            'expected_ctc.required' => 'Enter your expected CTC.',
            'expected_ctc.min' => 'Expected CTC cannot be negative.',
            'linkedin_url.url' => 'Enter a valid LinkedIn URL.',
            'portfolio_url.url' => 'Enter a valid portfolio URL.',
            ...ResumeRules::messages(),
        ];
    }
}
