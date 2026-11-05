<?php

namespace App\Models;

use App\Support\Auditable;
use Database\Factories\RoleBlockFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RoleBlock extends Model
{
    /** @use HasFactory<RoleBlockFactory> */
    use Auditable, HasFactory;

    protected $fillable = [
        'candidate_id',
        'role_key',
        'blocked_until',
        'reason',
        'source_application_id',
        'overridden_by',
        'overridden_at',
        'override_reason',
    ];

    public function casts(): array
    {
        return [
            'blocked_until' => 'datetime',
            'overridden_at' => 'datetime',
        ];
    }

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(Candidate::class);
    }

    public function sourceApplication(): BelongsTo
    {
        return $this->belongsTo(Application::class, 'source_application_id');
    }

    public function overrider(): BelongsTo
    {
        return $this->belongsTo(User::class, 'overridden_by');
    }

    public function scopeActive(Builder $query)
    {
        return $query->where('blocked_until', '>', now())->whereNull('overridden_at');
    }
}
