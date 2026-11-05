<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

class AuditActivityResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'action' => $this->action,
            'label' => $this->label(),
            'actor' => $this->user?->name,
            'created_at' => $this->created_at?->toIso8601String(),
            'summary' => $this->summary(),
        ];
    }

    private function label(): string
    {
        return match ($this->action) {
            'candidate.blacklisted' => 'Blacklisted',
            'candidate.unblacklisted' => 'Blacklist removed',
            'role_block.overridden' => 'Role block overridden',
            'export.queued' => 'Export queued',
            default => Str::headline(str_replace('.', ' ', (string) $this->action)),
        };
    }

    private function summary(): ?string
    {
        $values = $this->safe($this->new_values);

        if (filled($values['reason'] ?? null)) {
            return (string) $values['reason'];
        }

        if (filled($values['role_key'] ?? null)) {
            return 'Role: '.$values['role_key'];
        }

        $changed = array_keys($values);

        return $changed === [] ? null : 'Updated '.implode(', ', array_slice($changed, 0, 6));
    }

    /**
     * @param  array<string, mixed>|null  $values
     * @return array<string, mixed>
     */
    private function safe(?array $values): array
    {
        if ($values === null) {
            return [];
        }

        return Arr::except($values, [
            'password',
            'remember_token',
            'two_factor_secret',
            'two_factor_recovery_codes',
            'google_id',
            'date_of_birth',
            'phone',
            'current_ctc',
            'expected_ctc',
            'resume_path',
            'snapshot',
            'unsubscribe_token',
        ]);
    }
}
