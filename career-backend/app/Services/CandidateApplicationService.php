<?php

namespace App\Services;

use App\Models\Application;
use App\Models\Candidate;
use Illuminate\Database\Eloquent\ModelNotFoundException;

/**
 * What a signed-in candidate may see about one of their own applications.
 * Applications that belong to someone else are reported as not found.
 */
class CandidateApplicationService
{
    /**
     * @throws ModelNotFoundException
     */
    public function find(Candidate $candidate, string $publicId): Application
    {
        return $candidate->applications()
            ->where('public_id', $publicId)
            ->with(['entity', 'department', 'jobPosting.department', 'interviewRounds', 'statusHistories'])
            ->withExists('scheduledRounds as has_scheduled_round')
            ->firstOrFail();
    }
}
