<?php

namespace App\Services;

use App\Enums\ApplicationResult;
use App\Enums\ApplicationSource;
use App\Models\Application;
use App\Models\Department;
use App\Models\Entity;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;

/**
 * Hiring reports. Each one returns a table: columns plus rows, ready to show or download as CSV.
 */
class ReportService
{
    public const REPORTS = [
        'by-entity' => 'Applications by entity',
        'by-department' => 'Applications by department',
        'by-source' => 'Applications by source',
        'referrals' => 'Referrals by entity',
        'time-to-shortlist' => 'Time to shortlist',
        'selections' => 'Selections by entity',
    ];

    /**
     * @param  array{from?: ?string, to?: ?string, entity?: ?string}  $filters
     * @return array{title: string, columns: list<array{key: string, label: string}>, rows: list<array<string, mixed>>}
     */
    public function run(string $report, array $filters): array
    {
        $base = fn () => $this->base($filters);

        $result = match ($report) {
            'by-entity' => $this->groupedByEntity($base, fn (Builder $query) => [
                'total' => (clone $query)->count(),
                'shortlisted' => (clone $query)->whereNotNull('shortlisted_at')->count(),
                'selected' => (clone $query)->where('result', ApplicationResult::Selected)->count(),
            ], [['total', 'Applications'], ['shortlisted', 'Shortlisted'], ['selected', 'Selected']]),
            'by-department' => $this->byDepartment($base),
            'by-source' => $this->bySource($base),
            'referrals' => $this->groupedByEntity($base, fn (Builder $query) => [
                'referred' => (clone $query)->where('referred', true)->count(),
                'referred_selected' => (clone $query)->where('referred', true)->where('result', ApplicationResult::Selected)->count(),
            ], [['referred', 'Referred applications'], ['referred_selected', 'Referred and selected']]),
            'time-to-shortlist' => $this->timeToShortlist($base),
            'selections' => $this->groupedByEntity($base, fn (Builder $query) => [
                'selected' => (clone $query)->where('result', ApplicationResult::Selected)->count(),
                'not_selected' => (clone $query)->where('result', ApplicationResult::NotSelected)->count(),
            ], [['selected', 'Selected'], ['not_selected', 'Not selected']]),
            default => abort(404),
        };

        return ['title' => self::REPORTS[$report]] + $result;
    }

    private function base(array $filters): Builder
    {
        return Application::query()
            ->when(filled($filters['from'] ?? null), fn ($query) => $query->whereDate('applied_at', '>=', $filters['from']))
            ->when(filled($filters['to'] ?? null), fn ($query) => $query->whereDate('applied_at', '<=', $filters['to']))
            ->when(filled($filters['entity'] ?? null), fn ($query) => $query->forEntity($filters['entity']));
    }

    /**
     * @param  callable(): Builder  $base
     * @param  callable(Builder): array<string, int>  $metrics
     * @param  list<array{0: string, 1: string}>  $columns
     */
    private function groupedByEntity(callable $base, callable $metrics, array $columns): array
    {
        $rows = Entity::query()->orderBy('sort_order')->get()->map(fn (Entity $entity) => ['name' => $entity->name] + $metrics($base()->where('entity_id', $entity->id)))->all();
        $general = $base()->whereNull('entity_id');

        if ((clone $general)->exists()) {
            $rows[] = ['name' => 'General applications'] + $metrics($general);
        }

        return [
            'columns' => array_merge([['key' => 'name', 'label' => 'Entity']], array_map(fn ($column) => ['key' => $column[0], 'label' => $column[1]], $columns)),
            'rows' => $rows,
        ];
    }

    private function byDepartment(callable $base): array
    {
        $counts = $base()->selectRaw('department_id, count(*) as total, sum(case when shortlisted_at is not null then 1 else 0 end) as shortlisted')
            ->groupBy('department_id')->get()->keyBy('department_id');
        $names = Department::query()->withTrashed()->pluck('name', 'id');

        return [
            'columns' => [['key' => 'name', 'label' => 'Department'], ['key' => 'total', 'label' => 'Applications'], ['key' => 'shortlisted', 'label' => 'Shortlisted']],
            'rows' => $counts->map(fn ($row, $id) => [
                'name' => $names[$id] ?? 'No department',
                'total' => (int) $row->total,
                'shortlisted' => (int) $row->shortlisted,
            ])->sortByDesc('total')->values()->all(),
        ];
    }

    private function bySource(callable $base): array
    {
        $counts = $base()->selectRaw('source, count(*) as total')->groupBy('source')->pluck('total', 'source');
        $sum = max(1, (int) $counts->sum());

        return [
            'columns' => [['key' => 'name', 'label' => 'Source'], ['key' => 'total', 'label' => 'Applications'], ['key' => 'share', 'label' => 'Share (%)']],
            'rows' => collect(ApplicationSource::cases())->map(fn (ApplicationSource $source) => [
                'name' => $source->label(),
                'total' => (int) ($counts[$source->value] ?? 0),
                'share' => (int) round(((int) ($counts[$source->value] ?? 0)) / $sum * 100),
            ])->all(),
        ];
    }

    private function timeToShortlist(callable $base): array
    {
        $rows = Entity::query()->orderBy('sort_order')->get()->map(function (Entity $entity) use ($base) {
            $pairs = $base()->where('entity_id', $entity->id)->whereNotNull('shortlisted_at')->get(['applied_at', 'shortlisted_at']);
            $days = $pairs->map(fn ($application) => Carbon::parse($application->applied_at)->diffInHours(Carbon::parse($application->shortlisted_at)) / 24)->sort()->values();

            return [
                'name' => $entity->name,
                'shortlisted' => $days->count(),
                'average_days' => $days->isEmpty() ? null : round($days->avg(), 1),
                'median_days' => $days->isEmpty() ? null : round($days->median(), 1),
            ];
        })->all();

        return [
            'columns' => [['key' => 'name', 'label' => 'Entity'], ['key' => 'shortlisted', 'label' => 'Shortlisted'], ['key' => 'average_days', 'label' => 'Average days'], ['key' => 'median_days', 'label' => 'Median days']],
            'rows' => $rows,
        ];
    }
}
