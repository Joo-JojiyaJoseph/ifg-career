<?php

namespace App\Services;

use App\Enums\JobStatus;
use App\Filters\JobPostingFilter;
use App\Models\Department;
use App\Models\Entity;
use App\Models\JobPosting;
use App\Models\Skill;
use Illuminate\Contracts\Pagination\CursorPaginator;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class JobPostingService
{
    public function __construct(private readonly JobPostingFilter $filters) {}

    /**
     * @param  array<string, mixed>  $filters
     * @return array{paginator: CursorPaginator, total: int, counts: array<string, mixed>}
     */
    public function publicList(array $filters, ?string $cursor, int $perPage): array
    {
        $query = $this->publicQuery($filters);
        $total = (clone $query)->count();
        $this->filters->sort($query, $filters['sort'] ?? 'newest');

        return [
            'paginator' => $query->cursorPaginate($perPage, ['*'], 'cursor', $cursor),
            'total' => $total,
            'counts' => $this->publicCounts($filters),
        ];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array{paginator: LengthAwarePaginator, counts: array<string, mixed>}
     */
    public function hrList(array $filters, int $perPage): array
    {
        $query = $this->filters->apply(JobPosting::query(), $filters)
            ->with(['entity', 'department', 'team', 'skills', 'creator'])
            ->withCount('applications');
        $counts = $this->hrCounts($filters);
        $this->filters->sort($query, $filters['sort'] ?? 'posted_at', (string) ($filters['direction'] ?? 'desc'));

        return [
            'paginator' => $query->paginate($perPage)->withQueryString(),
            'counts' => $counts,
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): JobPosting
    {
        $skills = $data['skills'] ?? [];
        unset($data['skills']);

        $job = new JobPosting($this->attributes($data));
        $job->status = JobStatus::Draft;
        $job->save();
        $this->syncSkills($job, $skills);

        return $job->load(['entity', 'department', 'team', 'skills', 'creator']);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(JobPosting $job, array $data): JobPosting
    {
        $skills = $data['skills'] ?? null;
        unset($data['skills']);

        $job->fill($this->attributes($data, $job));
        $job->save();

        if (is_array($skills)) {
            $this->syncSkills($job, $skills);
        }

        return $job->load(['entity', 'department', 'team', 'skills', 'creator']);
    }

    public function publish(JobPosting $job): JobPosting
    {
        $job->load('skills');
        validator([
            'title' => $job->title,
            'entity' => $job->entity_id,
            'level' => $job->level?->value,
            'location' => $job->location,
            'summary' => $job->summary,
            'qualification' => $job->qualification,
            'experience' => $job->experience,
            'last_date_to_apply' => optional($job->last_date_to_apply)?->toDateString(),
            'skills' => $job->skills->pluck('slug')->all(),
        ], [
            'title' => ['required', 'string', 'max:150'],
            'entity' => ['required', 'integer'],
            'level' => ['required'],
            'location' => ['required', 'string', 'max:120'],
            'summary' => ['required', 'string'],
            'qualification' => ['required', 'string'],
            'experience' => ['required', 'string', 'max:150'],
            'last_date_to_apply' => ['required', 'date', 'after_or_equal:today'],
            'skills' => ['required', 'array', 'min:1'],
        ])->validate();

        $job->status = JobStatus::Published;
        $job->save();

        return $job->fresh(['entity', 'department', 'team', 'skills', 'creator']);
    }

    public function unpublish(JobPosting $job): JobPosting
    {
        $job->status = JobStatus::Draft;
        $job->save();

        return $job->fresh(['entity', 'department', 'team', 'skills', 'creator']);
    }

    public function close(JobPosting $job): JobPosting
    {
        $job->status = JobStatus::Closed;
        $job->save();

        return $job->fresh(['entity', 'department', 'team', 'skills', 'creator']);
    }

    public function extend(JobPosting $job, string $date): JobPosting
    {
        $job->last_date_to_apply = $date;
        if ($job->status !== JobStatus::Published) {
            $job->status = JobStatus::Published;
        }
        $job->save();

        return $job->fresh(['entity', 'department', 'team', 'skills', 'creator']);
    }

    public function duplicate(JobPosting $job): JobPosting
    {
        $job->load('skills');
        $suffix = ' (copy)';
        $max = 150 - mb_strlen($suffix);
        $title = mb_strlen($job->title) > $max ? mb_substr($job->title, 0, $max) : $job->title;

        $copy = $job->replicate(['public_id', 'posted_at', 'published_at', 'closed_at', 'deleted_at']);
        $copy->public_id = null;
        $copy->title = $title.$suffix;
        $copy->role_key = $job->role_key;
        $copy->status = JobStatus::Draft;
        $copy->posted_at = null;
        $copy->published_at = null;
        $copy->closed_at = null;
        $copy->save();
        $copy->skills()->sync($job->skills->pluck('id')->all());

        return $copy->load(['entity', 'department', 'team', 'skills', 'creator']);
    }

    /**
     * @param  list<string>  $publicIds
     * @return array{updated: int, failed: list<array{id: string, message: string}>}
     */
    public function bulk(string $action, array $publicIds): array
    {
        $updated = 0;
        $failed = [];

        $jobs = JobPosting::query()->whereIn('public_id', $publicIds)->get();

        foreach ($publicIds as $publicId) {
            $job = $jobs->firstWhere('public_id', $publicId);
            if (! $job) {
                $failed[] = ['id' => $publicId, 'message' => 'That role could not be found.'];

                continue;
            }

            try {
                match ($action) {
                    'publish' => $this->publish($job),
                    'unpublish' => $this->unpublish($job),
                    'close' => $this->close($job),
                    default => throw ValidationException::withMessages(['action' => 'Choose a bulk action.']),
                };
                $updated++;
            } catch (ValidationException $exception) {
                $failed[] = [
                    'id' => $publicId,
                    'message' => collect($exception->errors())->flatten()->first() ?? 'This role could not be updated.',
                ];
            }
        }

        return ['updated' => $updated, 'failed' => $failed];
    }

    public function deleteDraft(JobPosting $job): void
    {
        if ($job->applications()->exists()) {
            throw ValidationException::withMessages([
                'job' => 'Roles with applications can only be closed.',
            ]);
        }

        if ($job->status !== JobStatus::Draft) {
            throw ValidationException::withMessages([
                'job' => 'Only drafts can be deleted. Close the role instead.',
            ]);
        }

        $job->delete();
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    public function publicCounts(array $filters): array
    {
        return [
            'entity' => $this->grouped($this->publicQuery($filters, 'entity'), 'entities.slug', true),
            'department' => $this->grouped($this->publicQuery($filters, 'department_id'), 'department_id'),
            'team' => $this->grouped($this->publicQuery($filters, 'team_id'), 'team_id'),
            'level' => $this->grouped($this->publicQuery($filters, 'level'), 'level'),
            'location' => $this->grouped($this->publicQuery($filters, 'location'), 'location'),
            'skill' => $this->skillCounts($this->publicQuery($filters, 'skills')),
            'posted' => [
                '24h' => $this->publicQuery($filters, 'posted')->where('posted_at', '>=', now()->subDay())->count(),
                '7d' => $this->publicQuery($filters, 'posted')->where('posted_at', '>=', now()->subDays(7))->count(),
                '30d' => $this->publicQuery($filters, 'posted')->where('posted_at', '>=', now()->subDays(30))->count(),
            ],
            'closing_soon' => $this->publicQuery($filters, 'closing_soon')->closingWithin(7)->count(),
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function attributes(array $data, ?JobPosting $existing = null): array
    {
        $attributes = [];

        if (array_key_exists('title', $data)) {
            $attributes['title'] = $data['title'];
        }

        if (array_key_exists('role_key', $data) && filled($data['role_key'])) {
            $attributes['role_key'] = mb_strtolower(trim((string) $data['role_key']));
        }

        if (array_key_exists('entity', $data)) {
            $attributes['entity_id'] = filled($data['entity'])
                ? Entity::query()->where('slug', $data['entity'])->value('id')
                : null;
        }

        foreach (['department_id', 'team_id', 'level', 'location', 'summary', 'qualification', 'experience', 'why_join_us', 'last_date_to_apply'] as $field) {
            if (array_key_exists($field, $data)) {
                $attributes[$field] = $data[$field] === '' ? null : $data[$field];
            }
        }

        if ($existing && ! array_key_exists('role_key', $attributes)) {
            unset($attributes['role_key']);
        }

        $this->assertDepartmentFitsEntity(
            array_key_exists('department_id', $attributes) ? $attributes['department_id'] : $existing?->department_id,
            array_key_exists('entity_id', $attributes) ? $attributes['entity_id'] : $existing?->entity_id,
        );

        return $attributes;
    }

    /** A job's department must belong to the job's company, or be group-wide. */
    private function assertDepartmentFitsEntity(?int $departmentId, ?int $entityId): void
    {
        if (! $departmentId) {
            return;
        }

        $owner = Department::query()->whereKey($departmentId)->value('entity_id');
        if ($owner !== null && $owner !== $entityId) {
            throw ValidationException::withMessages(['department_id' => 'This department belongs to another company. Choose one of this company\'s departments.']);
        }
    }

    /**
     * @param  list<string>  $slugs
     */
    private function syncSkills(JobPosting $job, array $slugs): void
    {
        $ids = Skill::query()->whereIn('slug', $slugs)->pluck('id')->all();
        $job->skills()->sync($ids);
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    private function publicQuery(array $filters, ?string $except = null): Builder
    {
        return $this->filters->apply(JobPosting::query()->open(), $filters, $except)
            ->with(['entity', 'department', 'team', 'skills']);
    }

    /**
     * @return array<string, int>
     */
    private function grouped(Builder $query, string $column, bool $joinEntity = false): array
    {
        $grouped = (clone $query)->reorder()->setEagerLoads([]);

        if ($joinEntity) {
            $grouped->join('entities', 'entities.id', '=', 'job_postings.entity_id')
                ->select('entities.slug as facet_key')
                ->selectRaw('count(*) as total')
                ->groupBy('entities.slug');
        } else {
            $grouped->whereNotNull($column)
                ->select($column.' as facet_key')
                ->selectRaw('count(*) as total')
                ->groupBy($column);
        }

        return $grouped->get()->mapWithKeys(fn ($row) => [(string) $row->facet_key => (int) $row->total])->all();
    }

    /**
     * @return array<string, int>
     */
    private function skillCounts(Builder $query): array
    {
        $jobIds = (clone $query)->reorder()->select('job_postings.id');

        return DB::table('job_posting_skill')
            ->join('skills', 'skills.id', '=', 'job_posting_skill.skill_id')
            ->whereIn('job_posting_skill.job_posting_id', $jobIds)
            ->groupBy('skills.slug')
            ->select('skills.slug', DB::raw('count(distinct job_posting_skill.job_posting_id) as total'))
            ->pluck('total', 'skills.slug')
            ->map(fn ($total) => (int) $total)
            ->all();
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    private function hrCounts(array $filters): array
    {
        $base = fn (?string $except = null) => $this->filters->apply(JobPosting::query(), $filters, $except);

        return [
            'status' => $this->grouped($base('status'), 'status'),
            'entity' => $this->grouped($base('entity'), 'entities.slug', true),
            'level' => $this->grouped($base('level'), 'level'),
            'location' => $this->grouped($base('location'), 'location'),
            'closing_soon' => $base('closing_within')->closingWithin(7)->count(),
        ];
    }
}
