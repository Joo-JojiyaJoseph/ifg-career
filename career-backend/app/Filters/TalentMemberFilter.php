<?php

namespace App\Filters;

use Illuminate\Database\Eloquent\Builder;

class TalentMemberFilter
{
    /**
     * @param  array<string, mixed>  $filters
     */
    public function apply(Builder $query, array $filters, ?string $except = null): Builder
    {
        $skip = fn (string $key) => $except === $key;

        if (! $skip('q') && filled($filters['q'] ?? null)) {
            $term = '%'.str_replace(['%', '_'], ['\%', '\_'], (string) $filters['q']).'%';
            $query->where(fn (Builder $inner) => $inner->where('name', 'like', $term)->orWhere('email', 'like', $term)->orWhere('phone', 'like', $term));
        }

        if (! $skip('source') && filled($filters['source'] ?? null)) {
            $query->where('source', $filters['source']);
        }

        if (! $skip('subscribed') && isset($filters['subscribed']) && $filters['subscribed'] !== null) {
            $query->where('is_subscribed', filter_var($filters['subscribed'], FILTER_VALIDATE_BOOLEAN));
        }

        if (! $skip('linked') && isset($filters['linked']) && $filters['linked'] !== null) {
            filter_var($filters['linked'], FILTER_VALIDATE_BOOLEAN) ? $query->whereNotNull('candidate_id') : $query->whereNull('candidate_id');
        }

        if (filled($filters['joined_from'] ?? null)) {
            $query->whereDate('subscribed_at', '>=', $filters['joined_from']);
        }

        if (filled($filters['joined_to'] ?? null)) {
            $query->whereDate('subscribed_at', '<=', $filters['joined_to']);
        }

        return $query;
    }
}
