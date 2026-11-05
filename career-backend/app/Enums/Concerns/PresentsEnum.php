<?php

namespace App\Enums\Concerns;

trait PresentsEnum
{
    /**
     * Options for API meta payloads and form selects.
     *
     * @return list<array{value: string, label: string, color: string}>
     */
    public static function options(): array
    {
        return array_map(fn (self $case) => [
            'value' => $case->value,
            'label' => $case->label(),
            'color' => $case->color(),
        ], self::cases());
    }
}
