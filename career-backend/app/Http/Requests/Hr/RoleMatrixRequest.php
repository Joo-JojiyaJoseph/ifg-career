<?php

namespace App\Http\Requests\Hr;

use App\Support\PermissionCatalog;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;

class RoleMatrixRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'roles' => ['required', 'array'],
            'roles.*' => ['array'],
            'roles.*.*' => ['string', Rule::in(PermissionCatalog::ALL)],
        ];
    }

    protected function passedValidation(): void
    {
        $known = Role::query()->where('guard_name', 'web')->pluck('name')->all();

        foreach (array_keys($this->input('roles', [])) as $role) {
            if (! in_array($role, $known, true)) {
                throw ValidationException::withMessages(['roles' => 'Unknown role: '.$role]);
            }
        }
    }
}
