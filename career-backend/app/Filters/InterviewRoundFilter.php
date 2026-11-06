<?php

namespace App\Filters;

use Illuminate\Database\Eloquent\Builder;

class InterviewRoundFilter
{
    /**
     * @param  array<string, mixed>  $filters
     */
    public function apply(Builder $query, array $filters, ?string $except = null): Builder
    {
        $skip = fn (string $key): bool => $except === $key;

        if (! $skip('from') && filled($filters['from'] ?? null)) {
            $query->where('scheduled_at', '>=', $filters['from'].' 00:00:00');
        }

        if (! $skip('to') && filled($filters['to'] ?? null)) {
            $query->where('scheduled_at', '<=', $filters['to'].' 23:59:59');
        }

        if (! $skip('when') && filled($filters['when'] ?? null)) {
            match ($filters['when']) {
                'today' => $query->whereDate('scheduled_at', today()),
                'week' => $query->whereBetween('scheduled_at', [now()->startOfWeek(), now()->endOfWeek()]),
                'upcoming' => $query->where('scheduled_at', '>=', now()),
                'past' => $query->where('scheduled_at', '<', now()),
                default => null,
            };
        }

        if (! $skip('status') && filled($filters['status'] ?? null)) {
            $query->where('status', $filters['status']);
        }

        if (! $skip('mode') && filled($filters['mode'] ?? null)) {
            $query->where('mode', $filters['mode']);
        }

        if (! $skip('sync') && filled($filters['sync'] ?? null)) {
            $query->where('calendar_sync_status', $filters['sync']);
        }

        if (! $skip('interviewer') && filled($filters['interviewer'] ?? null)) {
            $interviewer = (string) $filters['interviewer'];
            $query->where(function (Builder $inner) use ($interviewer) {
                $inner->where('interviewer_email', $interviewer)
                    ->orWhere('interviewer_name', 'like', '%'.$interviewer.'%');
            });
        }

        if (! $skip('round') && filled($filters['round'] ?? null)) {
            $query->where('public_id', $filters['round']);
        }

        $applicationFilters = array_filter([
            'entity' => $skip('entity') ? null : ($filters['entity'] ?? null),
            'job' => $skip('job') ? null : ($filters['job'] ?? null),
            'department_id' => $skip('department_id') ? null : ($filters['department_id'] ?? null),
            'candidate' => $filters['candidate'] ?? null,
            'search' => $skip('search') ? null : ($filters['search'] ?? null),
        ], fn ($value) => filled($value));

        if ($applicationFilters !== []) {
            $query->whereHas('application', fn (Builder $applications) => app(HrApplicationFilter::class)->apply($applications, $applicationFilters));
        }

        return $query;
    }

    public function sort(Builder $query, ?string $sort, string $direction = 'asc'): Builder
    {
        $columnDirection = $direction === 'desc' ? 'desc' : 'asc';

        return match ($sort) {
            'status' => $query->orderBy('status', $columnDirection)->orderBy('scheduled_at'),
            'interviewer' => $query->orderBy('interviewer_name', $columnDirection)->orderBy('scheduled_at'),
            default => $query->orderBy('scheduled_at', $columnDirection)->orderBy('id'),
        };
    }
}
