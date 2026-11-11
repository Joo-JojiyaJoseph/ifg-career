<?php

namespace App\Services;

use App\Enums\ApplicationStatus;
use App\Enums\ApplicationType;
use App\Filters\HrApplicationFilter;
use App\Models\Application;
use App\Models\JobPosting;
use App\Models\RoleBlock;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class HrApplicationService
{
    public function __construct(
        private readonly HrApplicationFilter $filters,
        private readonly ApplicationEligibilityService $eligibility,
    ) {}

    /**
     * @param  array<string, mixed>  $filters
     * @return array{paginator: LengthAwarePaginator, counts: array<string, mixed>}
     */
    public function list(array $filters, int $perPage): array
    {
        $query = Application::query();
        $this->filters->apply($query, $filters);
        $counts = $this->counts($filters);
        $this->filters->sort($query, $filters['sort'] ?? 'applied_at', (string) ($filters['direction'] ?? 'desc'));

        $query->with([
            'candidate',
            'entity',
            'department',
            'jobPosting',
        ])->withCount('interviewRounds');

        return [
            'paginator' => $query->paginate($perPage)->withQueryString(),
            'counts' => $counts,
        ];
    }

    public function changeStatus(Application $application, ApplicationStatus $status): Application
    {
        if ($application->status === $status) {
            return $this->present($application);
        }

        if ($application->result !== null) {
            throw ValidationException::withMessages([
                'status' => 'This application already has a final result ('.$application->result->label().'), so its status cannot change.',
            ]);
        }

        if (! $application->canTransitionTo($status)) {
            throw ValidationException::withMessages([
                'status' => 'That status change is not allowed from '.$application->status->label().'.',
            ]);
        }

        $application->status = $status;
        $application->save();

        return $this->present($application);
    }

    /**
     * @param  list<string>  $publicIds
     * @return array{updated: int, failed: list<array{id: string, message: string}>}
     */
    public function bulkStatus(array $publicIds, ApplicationStatus $status): array
    {
        $updated = 0;
        $failed = [];
        $applications = Application::query()->whereIn('public_id', $publicIds)->get();

        foreach ($publicIds as $publicId) {
            $application = $applications->firstWhere('public_id', $publicId);
            if (! $application) {
                $failed[] = ['id' => $publicId, 'message' => 'That application could not be found.'];

                continue;
            }

            try {
                $this->changeStatus($application, $status);
                $updated++;
            } catch (ValidationException $exception) {
                $failed[] = [
                    'id' => $publicId,
                    'message' => collect($exception->errors())->flatten()->first() ?? 'This application could not be updated.',
                ];
            }
        }

        return ['updated' => $updated, 'failed' => $failed];
    }

    public function undoStatus(Application $application, User $user): Application
    {
        $history = $application->statusHistories()->latest('id')->first();

        if ($application->result !== null) {
            throw ValidationException::withMessages([
                'status' => 'This application already has a final result, so its status cannot change.',
            ]);
        }

        if (! $history || $history->changed_by !== $user->id || $history->created_at === null || $history->created_at->lt(now()->subSeconds(15))) {
            throw ValidationException::withMessages([
                'status' => 'That status change can no longer be undone.',
            ]);
        }

        if ($history->to_status !== $application->status->value) {
            throw ValidationException::withMessages([
                'status' => 'That status change can no longer be undone.',
            ]);
        }

        $previous = ApplicationStatus::tryFrom((string) $history->from_status);
        if (! $previous) {
            throw ValidationException::withMessages([
                'status' => 'That status change can no longer be undone.',
            ]);
        }

        $changedAt = $history->created_at->copy()->subSeconds(2);

        DB::transaction(function () use ($application, $previous, $user, $changedAt) {
            $application->status = $previous;
            $application->save();

            $application->rejected_at = $previous === ApplicationStatus::Rejected ? $application->rejected_at : null;
            $application->shortlisted_at = $previous === ApplicationStatus::Shortlisted ? ($application->shortlisted_at ?? now()) : null;
            $application->saveQuietly();

            RoleBlock::query()
                ->where('source_application_id', $application->id)
                ->whereNull('overridden_at')
                ->where('created_at', '>=', $changedAt)
                ->get()
                ->each(function (RoleBlock $block) use ($user) {
                    $block->fill([
                        'overridden_by' => $user->id,
                        'overridden_at' => now(),
                        'override_reason' => 'Status change undone',
                    ])->save();
                });
        });

        return $this->present($application);
    }

    public function assignJob(Application $application, string $jobPublicId): Application
    {
        if ($application->type !== ApplicationType::General) {
            throw ValidationException::withMessages([
                'job' => 'Only a general application can be assigned to a role.',
            ]);
        }

        $job = JobPosting::query()->where('public_id', $jobPublicId)->first();
        if (! $job) {
            throw ValidationException::withMessages([
                'job' => 'Choose a role.',
            ]);
        }

        $application->loadMissing('candidate');
        $job->loadMissing('entity');
        $check = $this->eligibility->forJob($application->candidate, $job);

        if (! $check['eligible']) {
            throw ValidationException::withMessages([
                'job' => $this->assignmentMessage($check),
            ]);
        }

        $snapshot = $application->snapshot ?? [];
        $snapshot['assigned_from'] = 'general';
        $snapshot['job_title'] = $job->title;
        $snapshot['entity_name'] = $job->entity?->name;

        $application->fill([
            'type' => ApplicationType::Job,
            'job_posting_id' => $job->id,
            'entity_id' => $job->entity_id,
            'department_id' => $job->department_id,
            'snapshot' => $snapshot,
        ])->save();

        return $this->present($application);
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    public function counts(array $filters): array
    {
        $base = fn (?string $except = null) => $this->filters->apply(Application::query(), $filters, $except);

        return [
            'type' => [
                'all' => $base('type')->count(),
                'job' => (clone $base('type'))->where('type', 'job')->count(),
                'general' => (clone $base('type'))->where('type', 'general')->count(),
            ],
            'status' => $this->grouped($base('status'), 'status'),
            'source' => $this->grouped($base('source'), 'source'),
            'result' => $this->grouped($base('result'), 'result'),
        ];
    }

    private function present(Application $application): Application
    {
        return $application->fresh([
            'candidate',
            'entity',
            'department',
            'jobPosting',
        ])->loadCount('interviewRounds');
    }

    /**
     * @param  array{eligible: bool, code: ?string, until: ?string, message: ?string}  $check
     */
    private function assignmentMessage(array $check): string
    {
        return match ($check['code']) {
            'already_applied' => 'This candidate already has an application for that role.',
            'role_blocked' => 'This candidate is blocked from that role'.($check['until'] ? ' until '.$check['until'] : '').'.',
            'blacklisted' => 'This candidate is blacklisted and cannot be assigned to a role.',
            'deadline_passed' => 'That role is past its last date to apply.',
            'job_not_open' => 'That role is not open.',
            default => $check['message'] ?? 'This application cannot be assigned to that role.',
        };
    }

    /**
     * @return array<string, int>
     */
    private function grouped(Builder $query, string $column): array
    {
        return (clone $query)
            ->reorder()
            ->whereNotNull($column)
            ->select($column.' as facet_key')
            ->selectRaw('count(*) as total')
            ->groupBy($column)
            ->get()
            ->mapWithKeys(fn ($row) => [(string) $row->facet_key => (int) $row->total])
            ->all();
    }
}
