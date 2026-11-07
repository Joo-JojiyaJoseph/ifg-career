<?php

namespace App\Filters;

use App\Models\Candidate;
use Illuminate\Database\Eloquent\Builder;

class HrApplicationFilter
{
    /**
     * @param  array<string, mixed>  $filters
     */
    public function apply(Builder $query, array $filters, ?string $except = null): Builder
    {
        $skip = fn (string $key): bool => $except === $key;

        if (! $skip('type') && filled($filters['type'] ?? null)) {
            $query->where('type', $filters['type']);
        }

        if (! $skip('status') && filled($filters['status'] ?? null)) {
            $query->where('status', $filters['status']);
        }

        if (! $skip('entity') && filled($filters['entity'] ?? $filters['entity_id'] ?? null)) {
            $query->forEntity($filters['entity'] ?? $filters['entity_id']);
        }

        if (! $skip('department_id') && filled($filters['department_id'] ?? null)) {
            $query->where('department_id', $filters['department_id']);
        }

        if (! $skip('source') && filled($filters['source'] ?? null)) {
            $query->where('source', $filters['source']);
        }

        if (! $skip('gender') && filled($filters['gender'] ?? null)) {
            $query->whereHas('candidate', fn (Builder $candidates) => $candidates->where('gender', $filters['gender']));
        }

        if (! $skip('result') && filled($filters['result'] ?? null)) {
            $query->where('result', $filters['result']);
        }

        if (! $skip('referred')) {
            $referred = $this->flag($filters, 'referred');
            if ($referred !== null) {
                $query->where('referred', $referred);
            }
        }

        if (! $skip('job') && filled($filters['job_posting_id'] ?? null)) {
            $query->where('job_posting_id', $filters['job_posting_id']);
        }

        if (! $skip('job') && filled($filters['job'] ?? null)) {
            $role = (string) $filters['job'];
            $query->whereHas('jobPosting', function (Builder $jobs) use ($role) {
                $jobs->where('public_id', $role)
                    ->orWhere('role_key', mb_strtolower($role))
                    ->orWhere('title', 'like', '%'.$role.'%');
            });
        }

        if (! $skip('level') && filled($filters['level'] ?? null)) {
            $query->whereHas('jobPosting', fn (Builder $jobs) => $jobs->where('level', $filters['level']));
        }

        if (! $skip('candidate') && filled($filters['candidate'] ?? null)) {
            $publicId = (string) $filters['candidate'];
            $query->whereHas('candidate', fn (Builder $candidates) => $candidates->where('public_id', $publicId));
        }

        if (! $skip('applied_from') && filled($filters['applied_from'] ?? null)) {
            $query->whereDate('applied_at', '>=', $filters['applied_from']);
        }

        if (! $skip('applied_to') && filled($filters['applied_to'] ?? null)) {
            $query->whereDate('applied_at', '<=', $filters['applied_to']);
        }

        if (! $skip('has_interview') && $this->flag($filters, 'has_interview') !== null) {
            $this->flag($filters, 'has_interview')
                ? $query->whereHas('interviewRounds')
                : $query->whereDoesntHave('interviewRounds');
        }

        if (! $skip('flagged') && $this->flag($filters, 'flagged') !== null) {
            $query->where('is_flagged', $this->flag($filters, 'flagged'));
        }

        if (! $skip('search') && filled($filters['search'] ?? null)) {
            $search = (string) $filters['search'];
            $query->where(function (Builder $inner) use ($search) {
                $inner->whereHas('candidate', fn (Builder $candidate) => $candidate->search($search))
                    ->orWhereHas('jobPosting', fn (Builder $job) => $job->where('title', 'like', '%'.$search.'%'));
            });
        }

        return $query;
    }

    public function sort(Builder $query, ?string $sort, string $direction = 'desc'): Builder
    {
        $columnDirection = $direction === 'asc' ? 'asc' : 'desc';

        return match ($sort) {
            'status' => $query->orderBy('status', $columnDirection)->orderBy('id'),
            'candidate' => $query->orderBy(
                Candidate::query()
                    ->select('name')
                    ->whereColumn('candidates.id', 'applications.candidate_id')
                    ->limit(1),
                $columnDirection,
            )->orderBy('id'),
            default => $query->orderBy('applied_at', $columnDirection)->orderBy('id'),
        };
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    private function flag(array $filters, string $key): ?bool
    {
        if (! array_key_exists($key, $filters) || $filters[$key] === null || $filters[$key] === '') {
            return null;
        }

        return filter_var($filters[$key], FILTER_VALIDATE_BOOLEAN);
    }
}
