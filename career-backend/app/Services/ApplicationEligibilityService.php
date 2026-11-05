<?php

namespace App\Services;

use App\Enums\ApplicationStatus;
use App\Enums\ApplicationType;
use App\Enums\JobStatus;
use App\Models\Application;
use App\Models\Candidate;
use App\Models\JobPosting;
use App\Models\RoleBlock;

class ApplicationEligibilityService
{
    /**
     * @return array{eligible: bool, code: ?string, until: ?string, message: ?string}
     */
    public function forJob(Candidate $candidate, JobPosting $job): array
    {
        if ($job->status !== JobStatus::Published) {
            return $this->deny('job_not_open', null, 'This role is not open for applications.');
        }

        if ($job->last_date_to_apply === null || $job->last_date_to_apply->startOfDay()->lt(today())) {
            return $this->deny('deadline_passed', null, 'The last date to apply has passed.');
        }

        if ($paused = $this->blacklist($candidate)) {
            return $paused;
        }

        $already = $candidate->applications()->where('job_posting_id', $job->id)->exists();
        if ($already) {
            return $this->deny('already_applied', null, 'You have already applied for this role.');
        }

        $block = RoleBlock::query()
            ->active()
            ->where('candidate_id', $candidate->id)
            ->where('role_key', $job->role_key)
            ->first();

        if ($block) {
            return $this->deny(
                'role_blocked',
                $block->blocked_until->toDateString(),
                'You can apply for this role again after '.$block->blocked_until->format('d-m-Y').'.',
            );
        }

        return $this->allow();
    }

    /**
     * One open general application per department, unless it is closed or older than six months.
     *
     * @return array{eligible: bool, code: ?string, until: ?string, message: ?string}
     */
    public function forGeneral(Candidate $candidate, int $departmentId): array
    {
        if ($paused = $this->blacklist($candidate)) {
            return $paused;
        }

        $open = Application::query()
            ->where('candidate_id', $candidate->id)
            ->where('type', ApplicationType::General)
            ->where('department_id', $departmentId)
            ->where('applied_at', '>', now()->subMonths(6))
            ->where('status', '!=', ApplicationStatus::Rejected)
            ->whereNull('result')
            ->latest('applied_at')
            ->first();

        if ($open) {
            $until = $open->applied_at->copy()->addMonths(6);

            return $this->deny(
                'general_already_open',
                $until->toDateString(),
                'You already have an open application for this department. You can send another after '.$until->format('d-m-Y').'.',
            );
        }

        return $this->allow();
    }

    /**
     * @return array{eligible: bool, code: ?string, until: ?string, message: ?string}|null
     */
    private function blacklist(Candidate $candidate): ?array
    {
        if (! $candidate->is_blacklisted_now) {
            return null;
        }

        $until = $candidate->blacklist_until?->toDateString();

        return $this->deny(
            'blacklisted',
            $until,
            $until
                ? 'Applications from this profile are paused until '.$candidate->blacklist_until->format('d-m-Y').'.'
                : 'Applications from this profile are paused.',
        );
    }

    /**
     * @return array{eligible: bool, code: null, until: null, message: null}
     */
    private function allow(): array
    {
        return [
            'eligible' => true,
            'code' => null,
            'until' => null,
            'message' => null,
        ];
    }

    /**
     * @return array{eligible: bool, code: string, until: ?string, message: string}
     */
    private function deny(string $code, ?string $until, string $message): array
    {
        return [
            'eligible' => false,
            'code' => $code,
            'until' => $until,
            'message' => $message,
        ];
    }
}
