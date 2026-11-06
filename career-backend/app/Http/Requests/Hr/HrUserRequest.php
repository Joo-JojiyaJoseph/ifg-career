<?php

namespace App\Http\Requests\Hr;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class HrUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $creating = $this->isMethod('post');
        $user = $this->route('user');

        return [
            'name' => [$creating ? 'required' : 'sometimes', 'string', 'max:100'],
            'email' => $creating
                ? ['required', 'email:rfc', 'max:150', Rule::unique('users', 'email')->ignore($user?->id)]
                : ['prohibited'],
            'phone' => ['nullable', 'string', 'max:20'],
            'role' => [$creating ? 'required' : 'sometimes', Rule::exists('roles', 'name')->where('guard_name', 'web')],
        ];
    }

    public function messages(): array
    {
        return ['email.unique' => 'An HR user with this email already exists.', 'email.prohibited' => 'The email cannot be changed. Add a new user instead.'];
    }
}
