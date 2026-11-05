<?php

namespace App\Observers;

use App\Enums\ApplicationStatus;
use App\Models\Application;
use App\Models\Candidate;

class CandidateObserver
{
    public function saving(Candidate $candidate): void
    {
        if ($candidate->is_blacklisted && $candidate->isDirty('is_blacklisted')) {
            $candidate->blacklisted_at = now();
            $candidate->blacklist_until = now()->addMonths(6);

            if (auth('web')->id()) {
                $candidate->blacklisted_by = auth('web')->id();
            }
        }

        $candidate->profile_completed_at = $candidate->isProfileComplete()
            ? ($candidate->profile_completed_at ?? now())
            : null;
    }

    public function saved(Candidate $candidate): void
    {
        if (! $candidate->wasChanged('is_blacklisted') && ! $candidate->wasChanged('blacklist_until')) {
            return;
        }

        if ($candidate->is_blacklisted_now) {
            Application::query()
                ->where('candidate_id', $candidate->id)
                ->whereNull('result')
                ->where('status', '!=', ApplicationStatus::Rejected->value)
                ->update(['is_flagged' => true]);

            return;
        }

        Application::query()
            ->where('candidate_id', $candidate->id)
            ->update(['is_flagged' => false]);
    }
}
