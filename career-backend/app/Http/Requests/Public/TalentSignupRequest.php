<?php

namespace App\Http\Requests\Public;

use App\Rules\PhoneNumber;
use Illuminate\Foundation\Http\FormRequest;

class TalentSignupRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'email' => mb_strtolower((string) $this->input('email')),
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
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['required', 'string', 'max:20', new PhoneNumber],
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
            'name.required' => 'Enter your name.',
            'name.min' => 'Use at least 2 characters.',
            'name.max' => 'Use at most 100 characters.',
            'email.required' => 'Enter your email address.',
            'email.email' => 'Enter a valid email address.',
            'phone.required' => 'Enter your phone number.',
            'privacy_consent.accepted' => 'Agree to the privacy policy to continue.',
        ];
    }
}
