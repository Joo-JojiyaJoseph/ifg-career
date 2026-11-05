<?php

namespace App\Support;

use App\Models\AuditLog;
use Illuminate\Support\Arr;

trait Auditable
{
    public static function bootAuditable(): void
    {
        static::created(fn (self $model) => $model->writeAudit('created'));
        static::updated(fn (self $model) => $model->writeAudit('updated'));
        static::deleted(fn (self $model) => $model->writeAudit('deleted'));
    }

    protected function writeAudit(string $event): void
    {
        if (config('app.seeding')) {
            return;
        }

        $hidden = [
            'password',
            'remember_token',
            'two_factor_secret',
            'two_factor_recovery_codes',
            'google_id',
            'date_of_birth',
            'phone',
            'current_ctc',
            'expected_ctc',
            'unsubscribe_token',
        ];

        AuditLog::query()->create([
            'user_id' => auth('web')->id(),
            'action' => class_basename($this).'.'.$event,
            'auditable_type' => $this->getMorphClass(),
            'auditable_id' => $this->getKey(),
            'old_values' => $event === 'created' ? null : Arr::except($this->getRawOriginal(), $hidden),
            'new_values' => $event === 'deleted' ? null : Arr::except($this->getAttributes(), $hidden),
            'ip' => request()?->ip(),
            'user_agent' => request()?->userAgent(),
        ]);
    }
}
