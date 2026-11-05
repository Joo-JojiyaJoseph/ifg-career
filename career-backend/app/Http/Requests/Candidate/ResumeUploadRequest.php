<?php

namespace App\Http\Requests\Candidate;

use App\Support\ResumeRules;
use Illuminate\Foundation\Http\FormRequest;

class ResumeUploadRequest extends FormRequest
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
            'resume' => ResumeRules::file(),
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return ResumeRules::messages();
    }
}
