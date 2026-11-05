<?php

namespace App\Filters;

use App\Models\Application;
use Illuminate\Database\Eloquent\Builder;

class CandidateFilter
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

        if (! $skip('gender') && filled($filters['gender'] ?? null)) {
            $query->where('gender', $filters['gender']);
        }

        if (! $skip('location') && filled($filters['location'] ?? null)) {
            $query->where('location', 'like', '%'.$filters['location'].'%');
        }

        if (! $skip('qualification') && filled($filters['qualification'] ?? null)) {
            $query->where('highest_qualification', 'like', '%'.$filters['qualification'].'%');
        }

        if (! $skip('signup_source') && filled($filters['signup_source'] ?? null)) {
            $query->where('signup_source', $filters['signup_source']);
        }

        if (! $skip('colour_tag') && filled($filters['colour_tag'] ?? null)) {
            $query->where('colour_tag', $filters['colour_tag']);
        }

        if (! $skip('blacklisted') && $this->flag($filters, 'blacklisted') !== null) {
            $this->flag($filters, 'blacklisted')
                ? $query->blacklistedNow()
                : $query->where(fn (Builder $inner) => $inner->where('is_blacklisted', false)->orWhere('blacklist_until', '<=', now()));
        }

        if (! $skip('experience') && array_key_exists('experience_min', $filters) && $filters['experience_min'] !== null && $filters['experience_min'] !== '') {
            $query->where('years_experience', '>=', $filters['experience_min']);
        }

        if (! $skip('experience') && array_key_exists('experience_max', $filters) && $filters['experience_max'] !== null && $filters['experience_max'] !== '') {
            $query->where('years_experience', '<=', $filters['experience_max']);
        }

        if (! $skip('ctc') && array_key_exists('ctc_min', $filters) && $filters['ctc_min'] !== null && $filters['ctc_min'] !== '') {
            $query->where('expected_ctc', '>=', $filters['ctc_min']);
        }

        if (! $skip('ctc') && array_key_exists('ctc_max', $filters) && $filters['ctc_max'] !== null && $filters['ctc_max'] !== '') {
            $query->where('expected_ctc', '<=', $filters['ctc_max']);
        }

        if (! $skip('age') && filled($filters['age_min'] ?? null)) {
            $query->whereDate('date_of_birth', '<=', now()->subYears((int) $filters['age_min'])->toDateString());
        }

        if (! $skip('age') && filled($filters['age_max'] ?? null)) {
            $query->whereDate('date_of_birth', '>', now()->subYears(((int) $filters['age_max']) + 1)->toDateString());
        }

        if (! $skip('profile_complete') && $this->flag($filters, 'profile_complete') !== null) {
            $this->flag($filters, 'profile_complete')
                ? $query->whereNotNull('profile_completed_at')
                : $query->whereNull('profile_completed_at');
        }

        if (! $skip('role_block') && $this->flag($filters, 'has_role_block') !== null) {
            $this->flag($filters, 'has_role_block')
                ? $query->whereHas('activeRoleBlocks')
                : $query->whereDoesntHave('activeRoleBlocks');
        }

        if (! $skip('applications')) {
            $this->constrainApplications($query, $filters);
        }

        return $query;
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function sort(Builder $query, ?string $sort, string $direction = 'asc'): Builder
    {
        $columnDirection = $direction === 'desc' ? 'desc' : 'asc';

        return match ($sort) {
            'experience' => $query->orderBy('years_experience', $columnDirection)->orderBy('id'),
            'name' => $query->orderBy('name', $columnDirection)->orderBy('id'),
            'applied_at' => $query->orderBy(
                Application::query()
                    ->select('applied_at')
                    ->whereColumn('applications.candidate_id', 'candidates.id')
                    ->latest('applied_at')
                    ->limit(1),
                $columnDirection,
            )->orderBy('id'),
            default => $query->orderBy('name')->orderBy('id'),
        };
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    private function constrainApplications(Builder $query, array $filters): void
    {
        $referred = $this->flag($filters, 'has_referral');
        $active = filled($filters['entity'] ?? null)
            || filled($filters['role'] ?? null)
            || filled($filters['department_id'] ?? null)
            || filled($filters['application_status'] ?? null)
            || filled($filters['applied_from'] ?? null)
            || filled($filters['applied_to'] ?? null)
            || $referred !== null;

        if (! $active) {
            return;
        }

        $query->whereHas('applications', function (Builder $applications) use ($filters, $referred) {
            if (filled($filters['entity'] ?? null)) {
                $applications->forEntity($filters['entity']);
            }

            if (filled($filters['department_id'] ?? null)) {
                $applications->where('department_id', $filters['department_id']);
            }

            if (filled($filters['application_status'] ?? null)) {
                $applications->where('status', $filters['application_status']);
            }

            if (filled($filters['applied_from'] ?? null)) {
                $applications->whereDate('applied_at', '>=', $filters['applied_from']);
            }

            if (filled($filters['applied_to'] ?? null)) {
                $applications->whereDate('applied_at', '<=', $filters['applied_to']);
            }

            if ($referred !== null) {
                $applications->where('referred', $referred);
            }

            if (filled($filters['role'] ?? null)) {
                $role = (string) $filters['role'];
                $applications->whereHas('jobPosting', function (Builder $jobs) use ($role) {
                    $jobs->where('public_id', $role)
                        ->orWhere('role_key', mb_strtolower($role))
                        ->orWhere('title', 'like', '%'.$role.'%');
                });
            }
        });
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
