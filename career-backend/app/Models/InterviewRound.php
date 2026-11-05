<?php

namespace App\Models;

use App\Enums\CalendarSyncStatus;
use App\Enums\InterviewMode;
use App\Enums\RoundStatus;
use App\Support\Auditable;
use Database\Factories\InterviewRoundFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;

class InterviewRound extends Model
{
    /** @use HasFactory<InterviewRoundFactory> */
    use Auditable, HasFactory;

    protected $fillable = [
        'application_id',
        'round_number',
        'round_name',
        'scheduled_at',
        'duration_minutes',
        'mode',
        'location_or_link',
        'interviewer_name',
        'interviewer_email',
        'google_event_id',
        'calendar_sync_status',
        'calendar_sync_error',
        'status',
        'feedback',
        'created_by',
        'reminder_sent_at',
    ];

    public function casts(): array
    {
        return [
            'mode' => InterviewMode::class,
            'status' => RoundStatus::class,
            'calendar_sync_status' => CalendarSyncStatus::class,
            'scheduled_at' => 'datetime',
            'reminder_sent_at' => 'datetime',
            'duration_minutes' => 'integer',
            'round_number' => 'integer',
        ];
    }

    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function candidate(): HasOneThrough
    {
        return $this->hasOneThrough(
            Candidate::class,
            Application::class,
            'id',
            'id',
            'application_id',
            'candidate_id',
        );
    }

    public function scopeUpcoming($query)
    {
        return $query->where('scheduled_at', '>=', now())->orderBy('scheduled_at');
    }

    public function scopeToday($query)
    {
        return $query->whereDate('scheduled_at', today());
    }

    public function scopeThisWeek($query)
    {
        return $query->whereBetween('scheduled_at', [now()->startOfWeek(), now()->endOfWeek()]);
    }

    public function scopeSyncFailed($query)
    {
        return $query->where('calendar_sync_status', CalendarSyncStatus::Failed);
    }
}
