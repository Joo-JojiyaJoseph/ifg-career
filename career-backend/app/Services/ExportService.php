<?php

namespace App\Services;

use App\Enums\ExportStatus;
use App\Filters\CandidateFilter;
use App\Filters\HrApplicationFilter;
use App\Filters\TalentMemberFilter;
use App\Jobs\GenerateExport;
use App\Models\Application;
use App\Models\AuditLog;
use App\Models\Candidate;
use App\Models\Export;
use App\Models\TalentMember;
use App\Models\User;
use App\Notifications\ExportReady;
use App\Support\XlsxWriter;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

class ExportService
{
    public function __construct(
        private readonly CandidateFilter $candidates,
        private readonly HrApplicationFilter $applications,
        private readonly XlsxWriter $xlsx,
    ) {}

    /**
     * @param  array<string, mixed>  $filters
     */
    public function queue(User $user, string $type, array $filters): Export
    {
        $filters = match ($type) {
            'applications' => $this->applicationFilters($filters),
            'talent_members' => array_filter(array_intersect_key($filters, array_flip(['q', 'source', 'subscribed', 'linked', 'joined_from', 'joined_to'])), fn ($value) => $value !== null && $value !== ''),
            default => $this->candidateFilters($filters),
        };

        $export = Export::query()->create([
            'user_id' => $user->id,
            'type' => $type,
            'filters' => $filters,
            'status' => ExportStatus::Queued,
        ]);

        AuditLog::query()->create([
            'user_id' => $user->id,
            'action' => 'export.queued',
            'auditable_type' => $export->getMorphClass(),
            'auditable_id' => $export->getKey(),
            'new_values' => [
                'type' => $type,
                'filter_keys' => array_keys(array_filter(
                    $filters,
                    fn ($value) => $value !== null && $value !== '' && $value !== [],
                )),
            ],
            'ip' => request()?->ip(),
            'user_agent' => request()?->userAgent(),
            'created_at' => now(),
        ]);

        GenerateExport::dispatch($export->id);

        return $export->fresh();
    }

    public function generate(Export $export): void
    {
        $export->status = ExportStatus::Processing;
        $export->save();

        try {
            [$headings, $rows] = match ($export->type) {
                'candidates' => $this->candidateSheet($export->filters ?? []),
                'applications' => $this->applicationSheet($export->filters ?? []),
                'talent_members' => $this->talentSheet($export->filters ?? []),
                default => throw new RuntimeException('Unknown export type.'),
            };

            $path = 'exports/'.Str::ulid().'.xlsx';
            $this->xlsx->store($headings, $rows, $path);

            $export->forceFill([
                'status' => ExportStatus::Ready,
                'file_path' => $path,
                'row_count' => count($rows),
                'expires_at' => now()->addDay(),
            ])->save();

            $export->user?->notify(new ExportReady($export));
        } catch (Throwable $exception) {
            $export->forceFill(['status' => ExportStatus::Failed])->save();

            throw $exception;
        }
    }

    /**
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>
     */
    private function candidateFilters(array $input): array
    {
        return array_filter([
            'search' => $input['q'] ?? $input['search'] ?? null,
            'entity' => $input['entity'] ?? null,
            'role' => $input['role'] ?? null,
            'department_id' => $input['department'] ?? $input['department_id'] ?? null,
            'gender' => $input['gender'] ?? null,
            'age_min' => $input['age_min'] ?? null,
            'age_max' => $input['age_max'] ?? null,
            'location' => $input['location'] ?? null,
            'qualification' => $input['qualification'] ?? null,
            'experience_min' => $input['experience_min'] ?? null,
            'experience_max' => $input['experience_max'] ?? null,
            'ctc_min' => $input['ctc_min'] ?? null,
            'ctc_max' => $input['ctc_max'] ?? null,
            'signup_source' => $input['signup_source'] ?? null,
            'colour_tag' => $input['colour_tag'] ?? null,
            'blacklisted' => $input['blacklisted'] ?? null,
            'has_referral' => $input['has_referral'] ?? null,
            'has_role_block' => $input['has_role_block'] ?? null,
            'application_status' => $input['application_status'] ?? null,
            'applied_from' => $input['applied_from'] ?? null,
            'applied_to' => $input['applied_to'] ?? null,
            'profile_complete' => $input['profile_complete'] ?? null,
        ], fn ($value) => $value !== null && $value !== '');
    }

    /**
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>
     */
    private function applicationFilters(array $input): array
    {
        return array_filter([
            'search' => $input['q'] ?? $input['search'] ?? null,
            'type' => $input['type'] ?? null,
            'entity' => $input['entity'] ?? null,
            'job' => $input['job'] ?? $input['role'] ?? null,
            'candidate' => $input['candidate'] ?? null,
            'department_id' => $input['department'] ?? $input['department_id'] ?? null,
            'level' => $input['level'] ?? null,
            'source' => $input['source'] ?? null,
            'referred' => $input['referred'] ?? null,
            'status' => $input['status'] ?? null,
            'result' => $input['result'] ?? null,
            'applied_from' => $input['applied_from'] ?? null,
            'applied_to' => $input['applied_to'] ?? null,
            'has_interview' => $input['has_interview'] ?? null,
            'flagged' => $input['flagged'] ?? null,
        ], fn ($value) => $value !== null && $value !== '');
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array{0: list<string>, 1: list<list<scalar|null>>}
     */
    private function candidateSheet(array $filters): array
    {
        $headings = ['Name', 'Email', 'Phone', 'Location', 'Gender', 'Highest qualification', 'Years of experience', 'Expected CTC', 'Signup source', 'Colour tag', 'Blacklisted', 'Profile complete', 'Preferred department'];
        $rows = [];

        $query = Candidate::query()->with('preferredDepartment:id,name');
        $this->candidates->apply($query, $filters);
        $query->orderBy('id')->chunkById(200, function ($candidates) use (&$rows) {
            foreach ($candidates as $candidate) {
                $rows[] = [
                    $candidate->name,
                    $candidate->email,
                    $candidate->phone,
                    $candidate->location,
                    $candidate->gender?->label(),
                    $candidate->highest_qualification,
                    $candidate->years_experience,
                    $candidate->expected_ctc,
                    $candidate->signup_source?->label(),
                    $candidate->colour_tag?->label(),
                    $candidate->is_blacklisted_now ? 'Yes' : 'No',
                    $candidate->profile_completed_at ? 'Yes' : 'No',
                    $candidate->preferredDepartment?->name,
                ];
            }
        });

        return [$headings, $rows];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array{0: list<string>, 1: list<list<scalar|null>>}
     */
    private function applicationSheet(array $filters): array
    {
        $headings = ['Candidate', 'Email', 'Type', 'Role', 'Entity', 'Department', 'Level', 'Source', 'Referred', 'Status', 'Result', 'Applied', 'Flagged'];
        $rows = [];

        $query = Application::query()->with(['candidate', 'entity', 'department', 'jobPosting']);
        $this->applications->apply($query, $filters);
        $query->orderBy('id')->chunkById(200, function ($applications) use (&$rows) {
            foreach ($applications as $application) {
                $rows[] = [
                    $application->candidate?->name,
                    $application->candidate?->email,
                    $application->type?->label(),
                    $application->display_role,
                    $application->entity?->name,
                    $application->department?->name,
                    $application->jobPosting?->level?->label(),
                    $application->source?->label(),
                    $application->referred ? 'Yes' : 'No',
                    $application->status?->label(),
                    $application->result?->label(),
                    $application->applied_at?->format('d-m-Y'),
                    $application->is_flagged ? 'Yes' : 'No',
                ];
            }
        });

        return [$headings, $rows];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array{0: list<string>, 1: list<list<mixed>>}
     */
    private function talentSheet(array $filters): array
    {
        $headings = ['Name', 'Email', 'Phone', 'Source', 'Subscribed', 'Joined', 'Unsubscribed', 'Has candidate profile'];
        $rows = [];

        $query = TalentMember::query();
        app(TalentMemberFilter::class)->apply($query, $filters);
        $query->orderBy('id')->chunkById(500, function ($members) use (&$rows) {
            foreach ($members as $member) {
                $rows[] = [
                    $member->name,
                    $member->email,
                    $member->phone,
                    $member->source?->label(),
                    $member->is_subscribed ? 'Yes' : 'No',
                    $member->subscribed_at?->format('d-m-Y'),
                    $member->unsubscribed_at?->format('d-m-Y'),
                    $member->candidate_id ? 'Yes' : 'No',
                ];
            }
        });

        return [$headings, $rows];
    }
}
