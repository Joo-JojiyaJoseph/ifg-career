<?php

namespace App\Http\Requests\Hr;

use App\Support\ContentTypes;
use Illuminate\Foundation\Http\FormRequest;

class ContentItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        // Multipart forms send booleans as strings.
        foreach (['is_published', 'publish_permission_confirmed'] as $key) {
            if ($this->has($key)) {
                $this->merge([$key => filter_var($this->input($key), FILTER_VALIDATE_BOOLEAN)]);
            }
        }
    }

    public function rules(): array
    {
        return ContentTypes::rules((string) $this->route('type'), $this->isMethod('post') && ! $this->route('id'));
    }

    public function messages(): array
    {
        return [
            'is_published.declined_if' => 'Confirm the employee agreed to publish this story before you publish it.',
            'heroicon_name.regex' => 'Choose an icon from the list.',
            'youtube_url.regex' => 'Use a YouTube link, for example https://www.youtube.com/watch?v=…',
            'image.required' => 'Add an image.',
            'drive_date.before_or_equal' => 'Use the date the drive took place.',
        ];
    }
}
