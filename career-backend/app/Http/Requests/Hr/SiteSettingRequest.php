<?php

namespace App\Http\Requests\Hr;

use App\Rules\VirusFree;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SiteSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $image = ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,svg', 'max:4096', new VirusFree];

        return match ((string) $this->route('key')) {
            'hero' => [
                'eyebrow' => ['nullable', 'string', 'max:60'],
                'title' => ['nullable', 'string', 'max:60'],
                'motto' => ['required', 'string', 'max:120'],
                'company_line' => ['nullable', 'string', 'max:240'],
                'image' => $image,
            ],
            'entities_section' => ['title' => ['required', 'string', 'max:80'], 'intro' => ['nullable', 'string', 'max:300']],
            'interview_section' => ['eyebrow' => ['nullable', 'string', 'max:60'], 'title' => ['required', 'string', 'max:80'], 'image' => $image],
            'quick_apply_section' => ['title' => ['required', 'string', 'max:80'], 'intro' => ['nullable', 'string', 'max:400'], 'image' => $image],
            'faq_section' => ['title' => ['required', 'string', 'max:80']],
            'company_numbers' => [
                'employees' => ['nullable', 'integer', 'min:0', 'max:1000000'],
                'years' => ['nullable', 'integer', 'min:0', 'max:200'],
                'clients' => ['nullable', 'integer', 'min:0', 'max:1000000'],
            ],
            'about_intro' => ['title' => ['required', 'string', 'max:80'], 'intro' => ['nullable', 'string', 'max:600']],
            'social_links' => [
                'links' => ['present', 'array', 'max:8'],
                'links.*.name' => ['required', 'distinct', Rule::in(['Instagram', 'Facebook', 'LinkedIn', 'YouTube', 'X', 'Threads', 'WhatsApp'])],
                'links.*.url' => ['required', 'url:https', 'max:255'],
            ],
            'footer' => [
                'closing_title' => ['nullable', 'string', 'max:80'],
                'closing_text' => ['nullable', 'string', 'max:300'],
                'copyright' => ['required', 'string', 'max:150'],
                'contact_email' => ['nullable', 'email:rfc', 'max:150'],
                'contact_phone' => ['nullable', 'string', 'max:30'],
                'address' => ['nullable', 'string', 'max:200'],
                'tagline' => ['nullable', 'string', 'max:120'],
            ],
            'promo_card' => ['headline' => ['required', 'string', 'max:80'], 'tagline' => ['nullable', 'string', 'max:120'], 'image' => $image],
            'quick_apply_confirmation_text' => ['title' => ['required', 'string', 'max:80'], 'body' => ['required', 'string', 'max:400']],
            default => abort(404),
        };
    }
}
