<?php

namespace App\Support;

class ResumeRules
{
    /**
     * @return array<int, string>
     */
    public static function file(bool $required = true): array
    {
        return [$required ? 'required' : 'nullable', 'file', 'mimes:pdf,docx', 'max:5120'];
    }

    /**
     * @return array<string, string>
     */
    public static function messages(): array
    {
        return [
            'resume.required' => 'Add your resume.',
            'resume.file' => 'Add your resume.',
            'resume.mimes' => 'Upload a PDF or DOCX file.',
            'resume.max' => 'The resume must be 5 MB or smaller.',
        ];
    }
}
