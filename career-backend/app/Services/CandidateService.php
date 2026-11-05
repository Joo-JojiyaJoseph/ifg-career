<?php

namespace App\Services;

use App\Enums\ColourTag;
use App\Filters\CandidateFilter;
use App\Models\Application;
use App\Models\AuditLog;
use App\Models\Candidate;
use App\Models\CandidateNote;
use App\Models\RoleBlock;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\URL;
use Illuminate\Validation\ValidationException;

class CandidateService
{
    public function __construct(private readonly CandidateFilter $filters) {}

    /**
     * @param  array<string, mixed>  $filters
     * @return array{paginator: LengthAwarePaginator, counts: array<string, mixed>}
     */
    public function list(array $filters, int $perPage): array
    {
        $query = Candidate::query();
        $this->filters->apply($query, $filters);
        $counts = $this->counts($filters);
        $this->filters->sort($query, $filters['sort'] ?? 'name', (string) ($filters['direction'] ?? 'asc'));

        $query->with([
            'preferredDepartment:id,name',
            'latestApplication.entity',
            'latestApplication.jobPosting',
            'latestApplication.department',
        ])->withCount(['applications', 'activeRoleBlocks']);

        return [
            'paginator' => $query->paginate($perPage)->withQueryString(),
            'counts' => $counts,
        ];
    }

    public function show(Candidate $candidate): Candidate
    {
        return $candidate->load([
            'preferredDepartment:id,name',
            'blacklistedBy:id,name',
            'notes.author:id,name',
            'roleBlocks.overrider:id,name',
            'roleBlocks.sourceApplication:id,public_id',
            'applications.entity',
            'applications.department',
            'applications.jobPosting',
            'applications.interviewRounds',
        ])->loadCount(['applications', 'activeRoleBlocks']);
    }

    public function updateColour(Candidate $candidate, string $colour): Candidate
    {
        $candidate->colour_tag = ColourTag::from($colour);
        $candidate->save();

        return $this->show($candidate);
    }

    public function addNote(Candidate $candidate, User $author, string $body): CandidateNote
    {
        return $candidate->notes()->create([
            'user_id' => $author->id,
            'body' => $body,
        ])->load('author:id,name');
    }

    public function blacklist(Candidate $candidate, User $user, string $reason): Candidate
    {
        if ($candidate->is_blacklisted_now) {
            throw ValidationException::withMessages([
                'reason' => 'This candidate is already blacklisted.',
            ]);
        }

        $candidate->blacklist_reason = $reason;
        $candidate->is_blacklisted = true;
        $candidate->save();

        $this->audit($user, 'candidate.blacklisted', $candidate, [
            'reason' => $reason,
            'until' => $candidate->fresh()->blacklist_until?->toDateString(),
        ]);

        return $this->show($candidate);
    }

    public function removeBlacklist(Candidate $candidate, User $user, string $reason): Candidate
    {
        if (! $candidate->is_blacklisted_now) {
            throw ValidationException::withMessages([
                'reason' => 'This candidate is not blacklisted.',
            ]);
        }

        $candidate->is_blacklisted = false;
        $candidate->blacklist_until = now();
        $candidate->save();

        $this->audit($user, 'candidate.unblacklisted', $candidate, [
            'reason' => $reason,
        ]);

        return $this->show($candidate);
    }

    public function overrideRoleBlock(Candidate $candidate, string $roleKey, User $user, string $reason): RoleBlock
    {
        $block = $candidate->roleBlocks()
            ->active()
            ->where('role_key', $roleKey)
            ->orderByDesc('blocked_until')
            ->first();

        if (! $block) {
            throw ValidationException::withMessages([
                'reason' => 'That block is no longer active.',
            ]);
        }

        $block->fill([
            'overridden_by' => $user->id,
            'overridden_at' => now(),
            'override_reason' => $reason,
        ])->save();

        $this->audit($user, 'role_block.overridden', $block, [
            'role_key' => $block->role_key,
            'reason' => $reason,
        ]);

        return $block->load(['overrider:id,name', 'sourceApplication:id,public_id']);
    }

    /**
     * @return Collection<int, AuditLog>
     */
    public function activity(Candidate $candidate): Collection
    {
        return AuditLog::query()
            ->with('user:id,name')
            ->where(function ($query) use ($candidate) {
                $query->where(fn ($inner) => $inner->where('auditable_type', $candidate->getMorphClass())->where('auditable_id', $candidate->id))
                    ->orWhere(fn ($inner) => $inner->where('auditable_type', (new Application)->getMorphClass())->whereIn('auditable_id', $candidate->applications()->select('id')))
                    ->orWhere(fn ($inner) => $inner->where('auditable_type', (new RoleBlock)->getMorphClass())->whereIn('auditable_id', $candidate->roleBlocks()->select('id')));
            })
            ->latest('created_at')
            ->limit(100)
            ->get();
    }

    /**
     * @return array{preview_url: ?string, download_url: ?string, filename: ?string, preview: bool}
     */
    public function resumeLinks(Candidate $candidate): array
    {
        if (blank($candidate->resume_path)) {
            return [
                'preview_url' => null,
                'download_url' => null,
                'filename' => null,
                'preview' => false,
            ];
        }

        $extension = strtolower(pathinfo($candidate->resume_path, PATHINFO_EXTENSION));

        return [
            'preview_url' => $this->signedResume($candidate, 'inline'),
            'download_url' => $this->signedResume($candidate, 'attachment'),
            'filename' => $candidate->resume_original_name,
            'preview' => $extension === 'pdf',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function counts(array $filters): array
    {
        $base = fn (?string $except = null) => $this->filters->apply(Candidate::query(), $filters, $except);

        return [
            'gender' => $this->grouped($base('gender'), 'gender'),
            'colour_tag' => $this->grouped($base('colour_tag'), 'colour_tag'),
            'signup_source' => $this->grouped($base('signup_source'), 'signup_source'),
            'blacklisted' => $base('blacklisted')->blacklistedNow()->count(),
            'profile_complete' => $base('profile_complete')->whereNotNull('profile_completed_at')->count(),
            'has_role_block' => $base('role_block')->whereHas('activeRoleBlocks')->count(),
        ];
    }

    /**
     * @param  array<string, mixed>  $context
     */
    private function audit(User $user, string $action, Candidate|RoleBlock $model, array $context): void
    {
        AuditLog::query()->create([
            'user_id' => $user->id,
            'action' => $action,
            'auditable_type' => $model->getMorphClass(),
            'auditable_id' => $model->getKey(),
            'new_values' => $context,
            'ip' => request()?->ip(),
            'user_agent' => request()?->userAgent(),
            'created_at' => now(),
        ]);
    }

    private function signedResume(Candidate $candidate, string $disposition): string
    {
        return URL::temporarySignedRoute('hr.candidates.resume.file', now()->addMinutes(5), [
            'candidate' => $candidate->public_id,
            'disposition' => $disposition,
        ]);
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
