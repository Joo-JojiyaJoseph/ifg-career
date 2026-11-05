<?php

namespace App\Observers;

use App\Support\CacheVersion;

class ContentObserver
{
    public function saved(object $model): void
    {
        if (! config('app.seeding')) {
            CacheVersion::bump('content');
        }
    }

    public function deleted(object $model): void
    {
        $this->saved($model);
    }
}
