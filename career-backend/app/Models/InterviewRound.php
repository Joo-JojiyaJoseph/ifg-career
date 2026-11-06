<?php

namespace App\Models;

use App\Enums\CalendarSyncStatus;
use App\Enums\InterviewMode;
use App\Enums\RoundStatus;
use App\Support\Auditable;
use App\Support\HasPublicId;
use Database\Factories\InterviewRoundFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;
use Illuminate\Support\Carbon;

class InterviewRound extends Model
{
    /** @use HasFactory<InterviewRoundFactory> */
    use Auditable, HasFactory, HasPublicId;

    protected $fillable = [
        'public_id',
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
        'calendar_sync_attempts',
        'calendar_synced_at',
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
            'calendar_synced_at' => 'datetime',
            'calendar_sync_attempts' => 'integer',
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

    public function endsAt(): Carbon
    {
        return $this->scheduled_at->copy()->addMinutes($this->duration_minutes ?: 60);
    }

    /**
     * Statuses this round may move to next.
     *
     * @return list<RoundStatus>
     */
    public function allowedStatuses(): array
    {
        return match ($this->status) {
            RoundStatus::Scheduled => [RoundStatus::Completed, RoundStatus::Passed, RoundStatus::NotSelected],
            RoundStatus::Completed => [RoundStatus::Passed, RoundStatus::NotSelected],
            RoundStatus::Passed, RoundStatus::NotSelected => [],
        };
    }

    public function scopeSyncFailed($query)
    {
        return $query->where('calendar_sync_status', CalendarSyncStatus::Failed);
    }
}
