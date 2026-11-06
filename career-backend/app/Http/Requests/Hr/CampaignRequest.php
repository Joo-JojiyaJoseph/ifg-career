<?php

namespace App\Http\Requests\Hr;

use App\Enums\CampaignType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CampaignRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type' => ['required', Rule::enum(CampaignType::class)],
            'subject' => ['required', 'string', 'max:200'],
            'body' => [Rule::requiredIf($this->input('type') === CampaignType::CompanyUpdate->value), 'nullable', 'string', 'max:20000'],
            'jobs' => [Rule::requiredIf($this->input('type') === CampaignType::JobAlert->value), 'array', 'max:20'],
            'jobs.*' => ['string', 'size:26', 'distinct'],
        ];
    }

    public function messages(): array
    {
        return [
            'body.required' => 'Write the update.',
            'jobs.required' => 'Choose at least one job.',
        ];
    }
}
