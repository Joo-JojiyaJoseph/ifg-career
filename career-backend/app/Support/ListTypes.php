<?php

namespace App\Support;

use App\Models\Department;
use App\Models\Skill;
use App\Models\Team;
use Illuminate\Validation\Rule;

/**
 * Lists the Admin maintains: departments (each under a company, or group-wide), teams (under a department)
 * and skills (linked to companies, or open to all).
 */
class ListTypes
{
    public const TYPES = [
        'departments' => Department::class,
        'teams' => Team::class,
        'skills' => Skill::class,
    ];

    public const PATTERN = 'departments|teams|skills';

    /**
     * @return class-string
     */
    public static function model(string $type): string
    {
        return self::TYPES[$type] ?? abort(404);
    }

    /**
     * @return array<string, mixed>
     */
    public static function rules(string $type, ?int $ignoreId): array
    {
        $required = $ignoreId ? 'sometimes' : 'required';

        return match ($type) {
            'departments' => [
                'name' => [$required, 'string', 'max:100'],
                'entity' => ['sometimes', 'nullable', 'string', Rule::exists('entities', 'slug')],
                'is_active' => ['sometimes', 'boolean'],
            ],
            'teams' => [
                'name' => [$required, 'string', 'max:100'],
                'department_id' => ['nullable', 'integer', Rule::exists('departments', 'id')->whereNull('deleted_at')],
                'is_active' => ['sometimes', 'boolean'],
            ],
            'skills' => [
                'name' => [$required, 'string', 'max:80', Rule::unique('skills', 'name')->ignore($ignoreId)],
                'entities' => ['sometimes', 'array'],
                'entities.*' => ['string', 'distinct', Rule::exists('entities', 'slug')],
                'is_active' => ['sometimes', 'boolean'],
            ],
            default => abort(404),
        };
    }
}
