<?php

namespace App\Services;

use App\Enums\ApplicationResult;
use App\Enums\ApplicationStatus;
use App\Enums\CalendarSyncStatus;
use App\Enums\RoundStatus;
use App\Filters\HrApplicationFilter;
use App\Filters\InterviewRoundFilter;
use App\Jobs\SyncInterviewToGoogleCalendar;
use App\Models\Application;
use App\Models\InterviewRound;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InterviewService
{
    private const ROUND_RELATIONS = [
        'application.candidate',
        'application.jobPosting',
        'application.entity',
        'application.department',
        'creator',
    ];

    public function __construct(
        private readonly InterviewRoundFilter $rounds,
        private readonly HrApplicationFilter $applications,
    ) {}

    /**
     * @param  array<string, mixed>  $filters
     * @return array{paginator: LengthAwarePaginator, counts: array<string, mixed>}
     */
    public function listRounds(array $filters, int $perPage): array
    {
        $query = $this->rounds->apply(InterviewRound::query(), $filters);
        $this->rounds->sort($query, $filters['sort'] ?? 'scheduled_at', (string) ($filters['direction'] ?? 'asc'));

        return [
            'paginator' => $query->with(self::ROUND_RELATIONS)->paginate($perPage)->withQueryString(),
            'counts' => $this->roundCounts($filters),
        ];
    }

    /**
     * Rounds between two dates for the calendar view (capped so a wide range stays fast).
     *
     * @param  array<string, mixed>  $filters
     * @return Collection<int, InterviewRound>
     */
    public function calendar(array $filters): Collection
    {
        $from = Carbon::parse($filters['from'] ?? now()->startOfWeek())->startOfDay();
        $to = Carbon::parse($filters['to'] ?? $from->copy()->endOfWeek())->endOfDay();

        if ($from->diffInDays($to) > 62) {
            $to = $from->copy()->addDays(62)->endOfDay();
        }

        $query = $this->rounds->apply(InterviewRound::query(), ['from' => null, 'to' => null] + $filters)
            ->whereBetween('scheduled_at', [$from, $to])
            ->orderBy('scheduled_at');

        return $query->with(self::ROUND_RELATIONS)->limit(500)->get();
    }

    /**
     * Shortlisted applications and where they are in the interview process.
     *
     * @param  array<string, mixed>  $filters
     * @return array{paginator: LengthAwarePaginator, counts: array<string, int>}
     */
    public function listApplications(array $filters, int $perPage): array
    {
        $query = $this->pipelineBase($filters);
        $this->applyStage($query, $filters['stage'] ?? null);

        $query->with([
            'candidate',
            'entity',
            'department',
            'jobPosting',
            'interviewRounds',
        ])->orderByDesc('shortlisted_at')->orderByDesc('id');

        return [
            'paginator' => $query->paginate($perPage)->withQueryString(),
            'counts' => $this->stageCounts($filters),
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array{round: InterviewRound, warnings: list<string>}
     */
    public function schedule(Application $application, array $data, User $user): array
    {
        $this->assertSchedulable($application);

        $round = DB::transaction(function () use ($application, $data, $user) {
            $next = (int) InterviewRound::query()->where('application_id', $application->id)->lockForUpdate()->max('round_number') + 1;

            return InterviewRound::query()->create([
                'application_id' => $application->id,
                'round_number' => $next,
                'round_name' => $data['round_name'],
                'scheduled_at' => $data['scheduled_at'],
                'duration_minutes' => $data['duration_minutes'] ?? 60,
                'mode' => $data['mode'],
                'location_or_link' => $data['location_or_link'] ?? null,
                'interviewer_name' => $data['interviewer_name'],
                'interviewer_email' => $data['interviewer_email'] ?? null,
                'status' => RoundStatus::Scheduled,
                'calendar_sync_status' => CalendarSyncStatus::Pending,
                'created_by' => $user->id,
            ]);
        });

        return ['round' => $this->present($round), 'warnings' => $this->conflicts($round)];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array{round: InterviewRound, warnings: list<string>}
     */
    public function update(InterviewRound $round, array $data): array
    {
        $round->loadMissing('application');

        if ($round->application->result !== null) {
            throw ValidationException::withMessages(['round' => 'This application already has a final result, so its rounds can no longer be changed.']);
        }

        if ($round->status !== RoundStatus::Scheduled) {
            throw ValidationException::withMessages(['round' => 'Only a scheduled round can be rescheduled.']);
        }

        $round->fill(array_intersect_key($data, array_flip([
            'round_name', 'scheduled_at', 'duration_minutes', 'mode', 'location_or_link', 'interviewer_name', 'interviewer_email',
        ])));

        if ($round->isDirty()) {
            $round->calendar_sync_status = CalendarSyncStatus::Pending;
            $round->save();
        }

        return ['round' => $this->present($round), 'warnings' => $this->conflicts($round)];
    }

    public function cancel(InterviewRound $round): void
    {
        if ($round->status !== RoundStatus::Scheduled) {
            throw ValidationException::withMessages(['round' => 'Only a scheduled round can be cancelled.']);
        }

        $round->delete();
    }

    public function changeStatus(InterviewRound $round, RoundStatus $status, ?string $feedback): InterviewRound
    {
        $round->loadMissing('application');

        if ($round->application->result !== null) {
            throw ValidationException::withMessages(['status' => 'This application already has a final result.']);
        }

        if ($round->status !== $status && ! in_array($status, $round->allowedStatuses(), true)) {
            throw ValidationException::withMessages(['status' => 'A '.$round->status->label().' round cannot be changed to '.$status->label().'.']);
        }

        $round->status = $status;

        if ($feedback !== null) {
            $round->feedback = $feedback;
        }

        $round->save();

        return $this->present($round);
    }

    public function setResult(Application $application, ApplicationResult $result): Application
    {
        if ($application->status !== ApplicationStatus::Shortlisted) {
            throw ValidationException::withMessages(['result' => 'Only a shortlisted application can be given a result.']);
        }

        if ($application->result !== null) {
            throw ValidationException::withMessages(['result' => 'This application already has a final result.']);
        }

        if ($result === ApplicationResult::Selected) {
            $rounds = $application->interviewRounds()->get(['id', 'status']);

            if ($rounds->isEmpty() || $rounds->contains(fn (InterviewRound $round) => $round->status !== RoundStatus::Passed)) {
                throw ValidationException::withMessages(['result' => 'A candidate is marked Selected only after passing every interview round.']);
            }
        }

        $application->result = $result;
        $application->save();

        return $application->fresh(['candidate', 'entity', 'department', 'jobPosting', 'interviewRounds']);
    }

    public function retrySync(InterviewRound $round): InterviewRound
    {
        $round->forceFill([
            'calendar_sync_status' => CalendarSyncStatus::Pending,
            'calendar_sync_error' => null,
        ])->saveQuietly();

        SyncInterviewToGoogleCalendar::dispatch($round->id, 'upsert');

        return $this->present($round);
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    public function roundCounts(array $filters): array
    {
        $base = fn (string $except) => $this->rounds->apply(InterviewRound::query(), $filters, $except);

        return [
            'status' => $this->grouped($base('status'), 'status'),
            'mode' => $this->grouped($base('mode'), 'mode'),
            'sync' => $this->grouped($base('sync'), 'calendar_sync_status'),
            'when' => [
                'today' => (clone $base('when'))->whereDate('scheduled_at', today())->count(),
                'week' => (clone $base('when'))->whereBetween('scheduled_at', [now()->startOfWeek(), now()->endOfWeek()])->count(),
                'upcoming' => (clone $base('when'))->where('scheduled_at', '>=', now())->count(),
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, int>
     */
    public function stageCounts(array $filters): array
    {
        $counts = [];

        foreach (['to_schedule', 'scheduled', 'awaiting_decision', 'selected', 'not_selected'] as $stage) {
            $query = $this->pipelineBase($filters);
            $this->applyStage($query, $stage);
            $counts[$stage] = $query->count();
        }

        $counts['all'] = $this->pipelineBase($filters)->count();

        return $counts;
    }

    private function pipelineBase(array $filters): Builder
    {
        $query = Application::query()->where(function (Builder $inner) {
            $inner->where('status', ApplicationStatus::Shortlisted)
                ->orWhereNotNull('result')
                ->orWhereHas('interviewRounds');
        });

        return $this->applications->apply($query, array_diff_key($filters, ['status' => true, 'result' => true]));
    }

    private function applyStage(Builder $query, ?string $stage): void
    {
        match ($stage) {
            'to_schedule' => $query->where('status', ApplicationStatus::Shortlisted)->whereNull('result')->whereDoesntHave('interviewRounds'),
            'scheduled' => $query->whereNull('result')->whereHas('interviewRounds', fn (Builder $rounds) => $rounds->whereIn('status', [RoundStatus::Scheduled, RoundStatus::Completed])),
            'awaiting_decision' => $query->where('status', ApplicationStatus::Shortlisted)->whereNull('result')
                ->whereHas('interviewRounds')
                ->whereDoesntHave('interviewRounds', fn (Builder $rounds) => $rounds->where('status', '!=', RoundStatus::Passed)),
            'selected' => $query->where('result', ApplicationResult::Selected),
            'not_selected' => $query->where('result', ApplicationResult::NotSelected),
            default => null,
        };
    }

    private function assertSchedulable(Application $application): void
    {
        if ($application->status !== ApplicationStatus::Shortlisted) {
            throw ValidationException::withMessages(['application' => 'Shortlist the application before scheduling an interview.']);
        }

        if ($application->result !== null) {
            throw ValidationException::withMessages(['application' => 'This application already has a final result.']);
        }

        if ($application->is_flagged) {
            throw ValidationException::withMessages(['application' => 'This candidate is blacklisted, so interviews cannot be scheduled.']);
        }

        $blocking = $application->interviewRounds()->whereIn('status', [RoundStatus::Scheduled, RoundStatus::Completed, RoundStatus::NotSelected])->exists();

        if ($blocking) {
            throw ValidationException::withMessages(['application' => 'Finish the current round (mark it Passed or Not selected) before scheduling the next one.']);
        }
    }

    /**
     * Soft warnings when the interviewer already has another round at the same time.
     *
     * @return list<string>
     */
    private function conflicts(InterviewRound $round): array
    {
        if (blank($round->interviewer_email)) {
            return [];
        }

        $start = $round->scheduled_at;
        $end = $round->endsAt();

        $overlapping = InterviewRound::query()
            ->whereKeyNot($round->id)
            ->where('interviewer_email', $round->interviewer_email)
            ->where('status', RoundStatus::Scheduled)
            ->whereBetween('scheduled_at', [$start->copy()->subHours(4), $end])
            ->get(['id', 'scheduled_at', 'duration_minutes'])
            ->filter(fn (InterviewRound $other) => $other->scheduled_at->lt($end) && $other->endsAt()->gt($start));

        return $overlapping->isEmpty() ? [] : [$round->interviewer_name.' already has another interview at this time.'];
    }

    private function present(InterviewRound $round): InterviewRound
    {
        return $round->fresh(self::ROUND_RELATIONS);
    }

    /**
     * @return array<string, int>
     */
    private function grouped(Builder $query, string $column): array
    {
        return (clone $query)
            ->reorder()
            ->select($column.' as facet_key')
            ->selectRaw('count(*) as total')
            ->groupBy($column)
            ->get()
            ->mapWithKeys(fn ($row) => [(string) $row->facet_key => (int) $row->total])
            ->all();
    }
}
