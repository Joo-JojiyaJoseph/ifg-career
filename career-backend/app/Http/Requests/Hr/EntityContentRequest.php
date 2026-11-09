<?php

namespace App\Http\Requests\Hr;

use App\Models\Entity;
use App\Rules\VirusFree;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Creating (POST /content/entities) or updating (POST /content/entities/{slug}) a company.
 * Name, visibility and order are only kept for users who may manage companies; the controller drops them otherwise.
 */
class EntityContentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $creating = $this->route('slug') === null;
        $current = $creating ? null : Entity::query()->where('slug', $this->route('slug'))->value('id');
        $required = $creating ? 'required' : 'sometimes';
        $hex = [$required, 'regex:/^#[0-9A-Fa-f]{6}$/'];
        $image = fn (int $kb, string $types) => ['nullable', 'file', "mimes:{$types}", "max:{$kb}", new VirusFree];

        return [
            'name' => [$required, 'string', 'max:50', Rule::unique('entities', 'name')->ignore($current)],
            'slug' => [$creating ? 'nullable' : 'prohibited', 'string', 'max:50', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', Rule::unique('entities', 'slug')],
            'motto' => ['sometimes', 'nullable', 'string', 'max:150'],
            'short_description' => ['sometimes', 'nullable', 'string', 'max:400'],
            'primary_color' => $hex,
            'secondary_color' => $hex,
            'accent_color' => $hex,
            'website_url' => ['sometimes', 'nullable', 'url:https,http', 'max:255'],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:999'],
            'is_active' => ['sometimes', 'boolean'],
            'logo' => $image(2048, 'jpg,jpeg,png,webp,svg'),
            'pattern' => $image(2048, 'svg,png,webp,jpg,jpeg'),
            'photo' => $image(4096, 'jpg,jpeg,png,webp'),
        ];
    }

    public function messages(): array
    {
        return [
            '*.regex' => 'Use a colour like #1976D2.',
            'slug.regex' => 'Use lowercase letters, numbers and dashes, for example "new-company".',
            'name.unique' => 'There is already a company with this name.',
            'slug.unique' => 'This web address is already used by another company.',
            'logo.mimes' => 'Upload the logo as SVG, PNG, WebP or JPG.',
            'photo.mimes' => 'Upload the photo as JPG, PNG or WebP.',
        ];
    }
}
