<?php

namespace App\Observers;

use App\Enums\JobStatus;
use App\Models\JobPosting;
use App\Support\CacheVersion;
use Illuminate\Support\Str;

class JobPostingObserver
{
    public function saving(JobPosting $job): void
    {
        if (filled($job->title)) {
            $slug = Str::slug($job->title);
            $job->slug = $slug !== '' ? $slug : 'role';

            $generated = mb_strtolower(trim((string) preg_replace('/\s+/', ' ', $job->title)));
            $titleChanged = $job->exists && $job->isDirty('title') && ! $job->isDirty('role_key');

            if (blank($job->role_key) || $titleChanged) {
                $job->role_key = $generated;
            }
        }

        if (auth('web')->check()) {
            $job->updated_by = auth('web')->id();

            if (! $job->exists && blank($job->created_by)) {
                $job->created_by = auth('web')->id();
            }
        }

        if ($job->status === JobStatus::Published && blank($job->published_at)) {
            $job->published_at = now();
            $job->posted_at ??= now();
        }

        if ($job->status === JobStatus::Closed && $job->isDirty('status')) {
            $job->closed_at = now();
        }

        if ($job->status === JobStatus::Published && $job->isDirty('status')) {
            $job->closed_at = null;
        }
    }

    public function saved(JobPosting $job): void
    {
        CacheVersion::bump('jobs');
    }

    public function deleted(JobPosting $job): void
    {
        CacheVersion::bump('jobs');
    }
}
