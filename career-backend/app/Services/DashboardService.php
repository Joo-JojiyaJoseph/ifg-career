<?php

namespace App\Services;

use App\Enums\ApplicationResult;
use App\Enums\ApplicationSource;
use App\Enums\ApplicationStatus;
use App\Enums\ApplicationType;
use App\Enums\RoundStatus;
use App\Models\Application;
use App\Models\Entity;
use App\Models\InterviewRound;
use App\Models\JobPosting;
use Carbon\CarbonPeriod;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Numbers for the Career Overview dashboard. Each widget is cached for 60 seconds per filter set.
 */
class DashboardService
{
    private ?int $entityId = null;

    public function forEntity(?string $slug): self
    {
        $this->entityId = filled($slug) ? Entity::query()->where('slug', $slug)->value('id') : null;

        return $this;
    }

    /**
     * @return array<string, mixed>
     */
    public function stats(): array
    {
        return $this->cached('stats', function () {
            $now = now();
            $monthAgo = $now->copy()->subDays(30);
            $twoMonthsAgo = $now->copy()->subDays(60);

            $openings = $this->jobs()->open()->count();
            $published = fn ($from, $to) => $this->jobs()->whereBetween('published_at', [$from, $to])->count();
            $applications = fn ($from, $to) => $this->applications()->whereBetween('applied_at', [$from, $to])->count();
            $shortlisted = fn ($from, $to) => $this->applications()->whereBetween('shortlisted_at', [$from, $to])->count();
            $interviews = fn ($from, $to) => $this->rounds()->whereBetween('scheduled_at', [$from, $to])->count();

            $weekStart = $now->copy()->startOfWeek();

            return [
                'active_openings' => [
                    'value' => $openings,
                    'delta' => $published($monthAgo, $now) - $published($twoMonthsAgo, $monthAgo),
                    'delta_kind' => 'count',
                    'period' => 'from last month',
                    'spark' => $this->weekly('job_postings', 'published_at'),
                ],
                'total_applicants' => [
                    'value' => $this->applications()->count(),
                    'delta' => $this->percent($applications($monthAgo, $now), $applications($twoMonthsAgo, $monthAgo)),
                    'delta_kind' => 'percent',
                    'period' => 'from last month',
                    'spark' => $this->weekly('applications', 'applied_at'),
                ],
                'shortlisted' => [
                    'value' => $this->applications()->where('status', ApplicationStatus::Shortlisted)->count(),
                    'delta' => $this->percent($shortlisted($monthAgo, $now), $shortlisted($twoMonthsAgo, $monthAgo)),
                    'delta_kind' => 'percent',
                    'period' => 'from last month',
                    'spark' => $this->weekly('applications', 'shortlisted_at'),
                ],
                'interviews_this_week' => [
                    'value' => $interviews($weekStart, $weekStart->copy()->endOfWeek()),
                    'delta' => $this->percent(
                        $interviews($weekStart, $weekStart->copy()->endOfWeek()),
                        $interviews($weekStart->copy()->subWeek(), $weekStart->copy()->subSecond()),
                    ),
                    'delta_kind' => 'percent',
                    'period' => 'from last week',
                    'spark' => $this->weekly('interview_rounds', 'scheduled_at'),
                ],
            ];
        });
    }

    /**
     * What needs attention now. Not cached, because it depends on the user's previous sign-in.
     *
     * @return array<string, int>
     */
    public function actionItems(?string $since): array
    {
        $since = $since ? Carbon::parse($since) : now()->subDay();

        return [
            'new_since_login' => $this->applications()->where('applied_at', '>=', $since)->count(),
            'new_today' => $this->applications()->whereDate('applied_at', today())->count(),
            'quick_apply_waiting' => $this->applications()->where('type', ApplicationType::General)->where('status', ApplicationStatus::Applied)->count(),
            'interviews_today' => $this->rounds()->where('status', RoundStatus::Scheduled)->whereDate('scheduled_at', today())->count(),
            'closing_soon' => $this->jobs()->open()->whereBetween('last_date_to_apply', [today(), today()->addDays(7)])->count(),
            'sync_failed' => $this->rounds()->syncFailed()->where('status', RoundStatus::Scheduled)->count(),
        ];
    }

    /**
     * @return array<string, int>
     */
    public function pipeline(): array
    {
        return $this->cached('pipeline', function () {
            $open = fn () => $this->applications()->whereNull('result');

            return [
                'applied' => $open()->where('status', ApplicationStatus::Applied)->count(),
                'under_review' => $open()->where('status', ApplicationStatus::UnderReview)->count(),
                'shortlisted' => $open()->where('status', ApplicationStatus::Shortlisted)->whereDoesntHave('interviewRounds')->count(),
                'interview' => $open()->where('status', ApplicationStatus::Shortlisted)->whereHas('interviewRounds')->count(),
                'selected' => $this->applications()->where('result', ApplicationResult::Selected)->count(),
                'rejected' => $open()->where('status', ApplicationStatus::Rejected)->count(),
                'not_selected' => $this->applications()->where('result', ApplicationResult::NotSelected)->count(),
            ];
        });
    }

    /**
     * Applications per bucket for the chart, optionally split by entity.
     *
     * @return array{buckets: list<array<string, mixed>>, entities: list<array{slug: string, name: string, color: ?string}>, total: int}
     */
    public function applicationsOverTime(string $range): array
    {
        return $this->cached('over-time:'.$range, function () use ($range) {
            [$start, $step, $format] = match ($range) {
                '3m' => [now()->subWeeks(12)->startOfWeek(), 'week', 'd M'],
                '6m' => [now()->subWeeks(25)->startOfWeek(), 'week', 'd M'],
                '1y' => [now()->subMonths(11)->startOfMonth(), 'month', 'M Y'],
                default => [now()->subDays(29)->startOfDay(), 'day', 'd M'],
            };

            $rows = $this->applications()
                ->where('applied_at', '>=', $start)
                ->selectRaw('DATE(applied_at) as day, entity_id, count(*) as total')
                ->groupBy('day', 'entity_id')
                ->get();

            $entities = Entity::query()->orderBy('sort_order')->get(['id', 'slug', 'name', 'primary_color']);
            $bySlug = $entities->keyBy('id');
            $buckets = [];

            foreach (CarbonPeriod::create($start, '1 '.$step, now()) as $moment) {
                $key = $this->bucketKey($moment, $step);
                $buckets[$key] = ['label' => $moment->format($format), 'start' => $moment->toDateString(), 'total' => 0]
                    + $entities->mapWithKeys(fn ($entity) => [$entity->slug => 0])->all();
            }

            foreach ($rows as $row) {
                $key = $this->bucketKey(Carbon::parse($row->day), $step);

                if (! isset($buckets[$key])) {
                    continue;
                }

                $buckets[$key]['total'] += (int) $row->total;
                $slug = $bySlug->get($row->entity_id)?->slug;

                if ($slug) {
                    $buckets[$key][$slug] += (int) $row->total;
                }
            }

            return [
                'buckets' => array_values($buckets),
                'entities' => $entities->map(fn ($entity) => ['slug' => $entity->slug, 'name' => $entity->name, 'color' => $entity->primary_color])->all(),
                'total' => array_sum(array_column($buckets, 'total')),
            ];
        });
    }

    /**
     * @return list<array{value: string, label: string, color: string, total: int, percent: int}>
     */
    public function sources(string $range): array
    {
        return $this->cached('sources:'.$range, function () use ($range) {
            $since = match ($range) {
                '3m' => now()->subMonths(3),
                '6m' => now()->subMonths(6),
                '1y' => now()->subYear(),
                default => now()->subMonth(),
            };

            $counts = $this->applications()->where('applied_at', '>=', $since)
                ->selectRaw('source, count(*) as total')->groupBy('source')->pluck('total', 'source');
            $sum = max(1, (int) $counts->sum());

            return collect(ApplicationSource::cases())->map(fn (ApplicationSource $source) => [
                'value' => $source->value,
                'label' => $source->label(),
                'color' => $source->color(),
                'total' => (int) ($counts[$source->value] ?? 0),
                'percent' => (int) round(((int) ($counts[$source->value] ?? 0)) / $sum * 100),
            ])->all();
        });
    }

    /**
     * @return Collection<int, InterviewRound>
     */
    public function upcomingInterviews(int $limit = 5)
    {
        return $this->rounds()
            ->where('status', RoundStatus::Scheduled)
            ->where('scheduled_at', '>=', now()->subHour())
            ->orderBy('scheduled_at')
            ->with(['application.candidate', 'application.jobPosting', 'application.department', 'application.entity'])
            ->limit($limit)
            ->get();
    }

    /**
     * @return Collection<int, Application>
     */
    public function recentApplications(int $limit = 6)
    {
        return $this->applications()
            ->with(['candidate', 'jobPosting', 'department', 'entity'])
            ->withCount('interviewRounds')
            ->latest('applied_at')
            ->limit($limit)
            ->get();
    }

    private function applications(): Builder
    {
        return Application::query()->when($this->entityId, fn ($query) => $query->where('entity_id', $this->entityId));
    }

    private function jobs(): Builder
    {
        return JobPosting::query()->when($this->entityId, fn ($query) => $query->where('entity_id', $this->entityId));
    }

    private function rounds(): Builder
    {
        return InterviewRound::query()->when($this->entityId, fn ($query) => $query->whereHas('application', fn ($applications) => $applications->where('entity_id', $this->entityId)));
    }

    /**
     * Eight weekly counts for a sparkline.
     *
     * @return list<int>
     */
    private function weekly(string $table, string $column): array
    {
        $start = now()->subWeeks(7)->startOfWeek();
        $query = DB::table($table)->where($column, '>=', $start)->whereNotNull($column);

        if ($this->entityId) {
            match ($table) {
                'applications', 'job_postings' => $query->where('entity_id', $this->entityId),
                'interview_rounds' => $query->whereIn('application_id', Application::query()->where('entity_id', $this->entityId)->select('id')),
                default => null,
            };
        }

        if ($table === 'job_postings') {
            $query->whereNull('deleted_at');
        }

        $days = $query->selectRaw("DATE({$column}) as day, count(*) as total")->groupBy('day')->pluck('total', 'day');
        $weeks = array_fill(0, 8, 0);

        foreach ($days as $day => $total) {
            $index = (int) floor($start->diffInDays(Carbon::parse($day)) / 7);

            if ($index >= 0 && $index < 8) {
                $weeks[$index] += (int) $total;
            }
        }

        return $weeks;
    }

    private function percent(int $current, int $previous): int
    {
        if ($previous === 0) {
            return $current > 0 ? 100 : 0;
        }

        return (int) round((($current - $previous) / $previous) * 100);
    }

    private function bucketKey(Carbon $moment, string $step): string
    {
        return match ($step) {
            'week' => $moment->copy()->startOfWeek()->toDateString(),
            'month' => $moment->format('Y-m'),
            default => $moment->toDateString(),
        };
    }

    private function cached(string $widget, callable $callback): mixed
    {
        return Cache::remember('dashboard:'.$widget.':'.($this->entityId ?? 'all'), now()->addSeconds(60), $callback);
    }
}
