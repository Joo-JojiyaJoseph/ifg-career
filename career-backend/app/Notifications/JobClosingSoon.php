<?php

namespace App\Notifications;

use App\Models\JobPosting;

class JobClosingSoon extends HrNotification
{
    public function __construct(public JobPosting $job) {}

    public function type(): string
    {
        return 'job_closing';
    }

    protected function payload(): array
    {
        $days = max(0, (int) today()->diffInDays($this->job->last_date_to_apply, false));

        return [
            'title' => 'Job closes in '.$days.' '.($days === 1 ? 'day' : 'days'),
            'message' => $this->job->title.' stops taking applications on '.$this->job->last_date_to_apply->format('d-m-Y').'. Extend the date if you still need applicants.',
            'url' => '/jobs/'.$this->job->public_id.'/edit',
            'level' => 'warning',
            'job_id' => $this->job->public_id,
        ];
    }
}
