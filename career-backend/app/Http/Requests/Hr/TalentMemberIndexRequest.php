<?php

namespace App\Http\Requests\Hr;

use App\Enums\TalentSource;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TalentMemberIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        foreach (['subscribed', 'linked'] as $key) {
            if ($this->input($key) === '') {
                $this->merge([$key => null]);
            }
        }
    }

    public function rules(): array
    {
        return [
            'q' => ['nullable', 'string', 'max:120'],
            'source' => ['nullable', Rule::enum(TalentSource::class)],
            'subscribed' => ['nullable', 'boolean'],
            'linked' => ['nullable', 'boolean'],
            'joined_from' => ['nullable', 'date'],
            'joined_to' => ['nullable', 'date'],
            'sort' => ['nullable', Rule::in(['subscribed_at', 'name'])],
            'direction' => ['nullable', Rule::in(['asc', 'desc'])],
            'per_page' => ['nullable', Rule::in([25, 50, 100])],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function filters(): array
    {
        return collect($this->validated())->except(['per_page', 'page'])->all();
    }
}
