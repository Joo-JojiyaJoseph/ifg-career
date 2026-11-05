<?php

namespace App\Observers;

use App\Enums\ApplicationResult;
use App\Enums\ApplicationSource;
use App\Enums\ApplicationStatus;
use App\Events\ApplicationStatusChanged;
use App\Models\Application;
use App\Models\ApplicationStatusHistory;
use App\Models\JobPosting;
use App\Models\RoleBlock;
use Illuminate\Support\Str;

class ApplicationObserver
{
    public function creating(Application $application): void
    {
        if (blank($application->public_id)) {
            $application->public_id = (string) Str::ulid();
        }

        $application->applied_at ??= now();

        if ($application->job_posting_id && blank($application->entity_id)) {
            $application->entity_id = JobPosting::query()->whereKey($application->job_posting_id)->value('entity_id');
        }

        if (filled($application->reference_id)) {
            $application->referred = true;
            $application->source = ApplicationSource::Referral;
        }
    }

    public function updated(Application $application): void
    {
        $statusChanged = $application->wasChanged('status');
        $resultChanged = $application->wasChanged('result');

        if (! $statusChanged && ! $resultChanged) {
            return;
        }

        $fromRaw = $application->getRawOriginal('status');
        $fromStatus = is_string($fromRaw) ? ApplicationStatus::tryFrom($fromRaw) : null;
        $toStatus = $application->status;

        ApplicationStatusHistory::query()->create([
            'application_id' => $application->id,
            'from_status' => $fromStatus?->value,
            'to_status' => $statusChanged ? $toStatus->value : $application->result?->value,
            'changed_by' => auth('web')->id(),
            'created_at' => now(),
        ]);

        $application->status_changed_at = now();
        $application->status_changed_by = auth('web')->id();

        if ($statusChanged && $toStatus === ApplicationStatus::Shortlisted) {
            $application->shortlisted_at = now();
        }

        if ($statusChanged && $toStatus === ApplicationStatus::Rejected) {
            $application->rejected_at = now();
        }

        if ($resultChanged && $application->result !== null) {
            $application->result_at = now();
        }

        $application->saveQuietly();

        event(new ApplicationStatusChanged($application, $fromStatus, $toStatus));

        $rejectedAfterShortlist = $statusChanged
            && $fromStatus === ApplicationStatus::Shortlisted
            && $toStatus === ApplicationStatus::Rejected;
        $notSelected = $resultChanged && $application->result === ApplicationResult::NotSelected;

        if (! $rejectedAfterShortlist && ! $notSelected) {
            return;
        }

        $roleKey = $application->jobPosting()->value('role_key');

        if (blank($roleKey)) {
            return;
        }

        $alreadyBlocked = RoleBlock::query()
            ->where('candidate_id', $application->candidate_id)
            ->where('role_key', $roleKey)
            ->where('source_application_id', $application->id)
            ->whereNull('overridden_at')
            ->exists();

        if ($alreadyBlocked) {
            return;
        }

        RoleBlock::query()->create([
            'candidate_id' => $application->candidate_id,
            'role_key' => $roleKey,
            'blocked_until' => now()->addMonths(6),
            'reason' => $notSelected ? 'Not selected' : 'Rejected after shortlisting',
            'source_application_id' => $application->id,
        ]);
    }
}
