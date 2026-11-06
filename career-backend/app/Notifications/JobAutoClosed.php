<?php

namespace App\Notifications;

use App\Models\JobPosting;

class JobAutoClosed extends HrNotification
{
    public function __construct(public JobPosting $job) {}

    public function type(): string
    {
        return 'job_auto_closed';
    }

    protected function payload(): array
    {
        return [
            'title' => 'Job closed automatically',
            'message' => $this->job->title.' passed its last date to apply and is no longer on the careers site.',
            'url' => '/jobs/'.$this->job->public_id.'/edit',
            'level' => 'info',
            'job_id' => $this->job->public_id,
        ];
    }
}
