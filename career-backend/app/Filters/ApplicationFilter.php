<?php

namespace App\Filters;

use App\Enums\ApplicationResult;
use App\Enums\ApplicationStatus;
use App\Models\Application;
use Illuminate\Database\Eloquent\Builder;

class ApplicationFilter
{
    /**
     * @param  array<string, mixed>  $filters
     */
    public function __construct(private array $filters) {}

    /**
     * @param  Builder<Application>  $query
     * @return Builder<Application>
     */
    public function apply(Builder $query, bool $withStatus = true): Builder
    {
        $query
            ->when($this->filters['entity'] ?? null, fn ($inner, $entity) => $inner->forEntity($entity))
            ->when($this->filters['applied_from'] ?? null, fn ($inner, $date) => $inner->whereDate('applied_at', '>=', $date))
            ->when($this->filters['applied_to'] ?? null, fn ($inner, $date) => $inner->whereDate('applied_at', '<=', $date));

        if ($withStatus && filled($this->filters['status'] ?? null)) {
            $this->candidateStatus($query, (string) $this->filters['status']);
        }

        return $query;
    }

    /**
     * @param  Builder<Application>  $query
     * @return array<string, int>
     */
    public function counts(Builder $query): array
    {
        $base = $this->apply(clone $query, false);

        return [
            'all' => (clone $base)->count(),
            'applied' => (clone $base)->tap(fn ($inner) => $this->candidateStatus($inner, 'applied'))->count(),
            'in_review' => (clone $base)->tap(fn ($inner) => $this->candidateStatus($inner, 'in_review'))->count(),
            'shortlisted' => (clone $base)->tap(fn ($inner) => $this->candidateStatus($inner, 'shortlisted'))->count(),
            'interview_scheduled' => (clone $base)->tap(fn ($inner) => $this->candidateStatus($inner, 'interview_scheduled'))->count(),
            'in_progress' => (clone $base)->tap(fn ($inner) => $this->candidateStatus($inner, 'in_progress'))->count(),
            'selected' => (clone $base)->tap(fn ($inner) => $this->candidateStatus($inner, 'selected'))->count(),
            'not_selected' => (clone $base)->tap(fn ($inner) => $this->candidateStatus($inner, 'not_selected'))->count(),
            'closed' => (clone $base)->tap(fn ($inner) => $this->candidateStatus($inner, 'closed'))->count(),
        ];
    }

    /**
     * @param  Builder<Application>  $query
     */
    private function candidateStatus(Builder $query, string $status): void
    {
        match ($status) {
            'applied' => $query->where('status', ApplicationStatus::Applied)->whereNull('result'),
            'in_review' => $query->where('status', ApplicationStatus::UnderReview)->whereNull('result'),
            'shortlisted' => $query->where('status', ApplicationStatus::Shortlisted)->whereNull('result')->whereDoesntHave('scheduledRounds'),
            'interview_scheduled' => $query->where('status', ApplicationStatus::Shortlisted)->whereNull('result')->whereHas('scheduledRounds'),
            // Everything still moving: no result yet and not rejected.
            'in_progress' => $query->whereNull('result')->where('status', '!=', ApplicationStatus::Rejected),
            'selected' => $query->where('result', ApplicationResult::Selected),
            'not_selected' => $query->where('result', ApplicationResult::NotSelected),
            'closed' => $query->where('status', ApplicationStatus::Rejected)->whereNull('result'),
            default => $query,
        };
    }
}
