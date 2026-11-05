<?php

namespace App\Filters;

use Illuminate\Database\Eloquent\Builder;

class JobPostingFilter
{
    /**
     * @param  array<string, mixed>  $filters
     */
    public function apply(Builder $query, array $filters, ?string $except = null): Builder
    {
        $skip = fn (string $key): bool => $except === $key;

        if (! $skip('search') && filled($filters['search'] ?? null)) {
            $query->search((string) $filters['search']);
        }

        if (! $skip('entity') && filled($filters['entity'] ?? null)) {
            $entity = $filters['entity'];
            $query->whereHas('entity', function (Builder $inner) use ($entity) {
                $inner->where('slug', $entity)->orWhere('id', $entity);
            });
        }

        if (! $skip('department_id') && filled($filters['department_id'] ?? null)) {
            $query->where('department_id', $filters['department_id']);
        }

        if (! $skip('team_id') && filled($filters['team_id'] ?? null)) {
            $query->where('team_id', $filters['team_id']);
        }

        if (! $skip('level') && filled($filters['level'] ?? null)) {
            $query->where('level', $filters['level']);
        }

        if (! $skip('location') && filled($filters['location'] ?? null)) {
            $query->where('location', $filters['location']);
        }

        if (! $skip('status') && filled($filters['status'] ?? null)) {
            $query->where('status', $filters['status']);
        }

        if (! $skip('skills') && filled($filters['skills'] ?? null)) {
            $skills = array_values(array_filter((array) $filters['skills']));
            if ($skills !== []) {
                $query->whereHas('skills', fn (Builder $inner) => $inner->whereIn('slug', $skills));
            }
        }

        if (! $skip('posted') && filled($filters['posted'] ?? null)) {
            $from = match ($filters['posted']) {
                '24h' => now()->subDay(),
                '7d' => now()->subDays(7),
                '30d' => now()->subDays(30),
                default => null,
            };

            if ($from) {
                $query->where('posted_at', '>=', $from);
            }
        }

        if (! $skip('closing_soon') && filter_var($filters['closing_soon'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
            $query->closingWithin(7);
        }

        if (! $skip('closing_within') && filled($filters['closing_within'] ?? null)) {
            $query->closingWithin((int) $filters['closing_within']);
        }

        if (! $skip('created_by') && filled($filters['created_by'] ?? null)) {
            $email = (string) $filters['created_by'];
            $query->whereHas('creator', fn (Builder $inner) => $inner->where('email', $email));
        }

        if (! $skip('posted_from') && filled($filters['posted_from'] ?? null)) {
            $query->whereDate('posted_at', '>=', $filters['posted_from']);
        }

        if (! $skip('posted_to') && filled($filters['posted_to'] ?? null)) {
            $query->whereDate('posted_at', '<=', $filters['posted_to']);
        }

        if (! $skip('last_date_from') && filled($filters['last_date_from'] ?? null)) {
            $query->whereDate('last_date_to_apply', '>=', $filters['last_date_from']);
        }

        if (! $skip('last_date_to') && filled($filters['last_date_to'] ?? null)) {
            $query->whereDate('last_date_to_apply', '<=', $filters['last_date_to']);
        }

        if (! $skip('has_applications') && ($filters['has_applications'] ?? null) !== null && $filters['has_applications'] !== '') {
            filter_var($filters['has_applications'], FILTER_VALIDATE_BOOLEAN)
                ? $query->has('applications')
                : $query->doesntHave('applications');
        }

        return $query;
    }

    public function sort(Builder $query, ?string $sort, string $direction = 'desc'): Builder
    {
        $descending = $direction !== 'asc';

        return match ($sort) {
            'closing' => $query->orderBy('last_date_to_apply', $descending ? 'asc' : 'desc')->orderBy('id'),
            'title' => $query->orderBy('title', $descending ? 'asc' : 'desc')->orderBy('id'),
            'applications' => $query->orderBy('applications_count', $descending ? 'desc' : 'asc')->orderBy('id'),
            'status' => $query->orderBy('status')->orderBy('title'),
            'newest', 'posted_at' => $query->orderBy('posted_at', $descending ? 'desc' : 'asc')->orderBy('id', $descending ? 'desc' : 'asc'),
            default => $query->orderByDesc('posted_at')->orderByDesc('id'),
        };
    }
}
