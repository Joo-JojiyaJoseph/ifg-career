<?php

namespace App\Notifications;

use App\Models\Candidate;

class BlockedApplicationAttempt extends HrNotification
{
    public function __construct(public Candidate $candidate, public string $role, public string $reason) {}

    public function type(): string
    {
        return 'blocked_application_attempt';
    }

    protected function payload(): array
    {
        $why = $this->reason === 'blacklisted' ? 'is blacklisted' : 'has a 6-month block for this role';

        return [
            'title' => 'Blocked application attempt',
            'message' => $this->candidate->name.' tried to apply for '.$this->role.' but '.$why.'.',
            'url' => '/candidates/'.$this->candidate->public_id,
            'level' => 'warning',
            'candidate_id' => $this->candidate->public_id,
        ];
    }
}
