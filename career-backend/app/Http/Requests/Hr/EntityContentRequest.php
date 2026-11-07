<?php

namespace App\Http\Requests\Hr;

use App\Rules\VirusFree;
use Illuminate\Foundation\Http\FormRequest;

class EntityContentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $hex = ['sometimes', 'required', 'regex:/^#[0-9A-Fa-f]{6}$/'];

        return [
            'motto' => ['sometimes', 'nullable', 'string', 'max:150'],
            'short_description' => ['sometimes', 'nullable', 'string', 'max:400'],
            'primary_color' => $hex,
            'secondary_color' => $hex,
            'accent_color' => $hex,
            'website_url' => ['sometimes', 'nullable', 'url:https,http', 'max:255'],
            'logo' => ['nullable', 'file', 'mimes:png,webp,svg', 'max:2048', new VirusFree],
            'pattern' => ['nullable', 'file', 'mimes:svg,png,webp', 'max:2048', new VirusFree],
            'photo' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:4096', new VirusFree],
        ];
    }

    public function messages(): array
    {
        return ['*.regex' => 'Use a colour like #1976D2.'];
    }
}
