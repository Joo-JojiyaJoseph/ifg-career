<?php

namespace App\Http\Requests\Public;

use App\Enums\Gender;
use App\Rules\AgeBetween;
use App\Rules\PhoneNumber;
use App\Support\ResumeRules;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class QuickApplyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'email' => mb_strtolower((string) $this->input('email')),
            'keep_updated' => $this->boolean('keep_updated'),
            'privacy_consent' => $this->boolean('privacy_consent') ? '1' : '0',
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
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['required', 'string', 'max:20', new PhoneNumber],
            'gender' => ['required', Rule::enum(Gender::class)],
            'highest_qualification' => ['required', 'string', 'max:255'],
            'location' => ['required', 'string', 'max:255'],
            'department_id' => ['required', 'integer', 'exists:departments,id'],
            'resume' => ResumeRules::file(),
            'keep_updated' => ['boolean'],
            'privacy_consent' => ['accepted'],
            'turnstile_token' => ['nullable', 'string'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Enter your full name.',
            'name.min' => 'Use at least 2 characters.',
            'name.max' => 'Use at most 100 characters.',
            'date_of_birth.required' => 'Enter your date of birth.',
            'date_of_birth.date' => 'Enter a valid date.',
            'date_of_birth.before' => 'Enter a past date.',
            'email.required' => 'Enter your email address.',
            'email.email' => 'Enter a valid email address.',
            'phone.required' => 'Enter your phone number.',
            'gender.required' => 'Choose a gender.',
            'gender.enum' => 'Choose Male, Female or Other.',
            'highest_qualification.required' => 'Enter your highest qualification.',
            'location.required' => 'Enter your city or town.',
            'department_id.required' => 'Choose a department.',
            'department_id.exists' => 'Choose a department from the list.',
            'privacy_consent.accepted' => 'Agree to the privacy policy to continue.',
            ...ResumeRules::messages(),
        ];
    }
}
