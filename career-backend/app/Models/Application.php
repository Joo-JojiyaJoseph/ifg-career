<?php

namespace App\Models;

use App\Enums\ApplicationResult;
use App\Enums\ApplicationSource;
use App\Enums\ApplicationStatus;
use App\Enums\ApplicationType;
use App\Enums\RoundStatus;
use App\Support\Auditable;
use App\Support\HasPublicId;
use Database\Factories\ApplicationFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Application extends Model
{
    /** @use HasFactory<ApplicationFactory> */
    use Auditable, HasFactory, HasPublicId;

    protected $fillable = [
        'public_id',
        'type',
        'candidate_id',
        'job_posting_id',
        'entity_id',
        'department_id',
        'applied_at',
        'source',
        'reference_id',
        'referred',
        'status',
        'result',
        'status_changed_at',
        'shortlisted_at',
        'rejected_at',
        'result_at',
        'status_changed_by',
        'snapshot',
        'resume_path',
        'is_flagged',
    ];

    public function casts(): array
    {
        return [
            'type' => ApplicationType::class,
            'source' => ApplicationSource::class,
            'status' => ApplicationStatus::class,
            'result' => ApplicationResult::class,
            'snapshot' => 'array',
            'referred' => 'boolean',
            'is_flagged' => 'boolean',
            'applied_at' => 'datetime',
            'status_changed_at' => 'datetime',
            'shortlisted_at' => 'datetime',
            'rejected_at' => 'datetime',
            'result_at' => 'datetime',
        ];
    }

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(Candidate::class);
    }

    public function jobPosting(): BelongsTo
    {
        return $this->belongsTo(JobPosting::class);
    }

    public function entity(): BelongsTo
    {
        return $this->belongsTo(Entity::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function statusChangedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'status_changed_by');
    }

    public function interviewRounds(): HasMany
    {
        return $this->hasMany(InterviewRound::class)->orderBy('round_number');
    }

    public function scheduledRounds(): HasMany
    {
        return $this->hasMany(InterviewRound::class)->where('status', RoundStatus::Scheduled);
    }

    public function candidateStatusCode(): string
    {
        if ($this->status === ApplicationStatus::Rejected || $this->result !== null) {
            return 'closed';
        }

        $interviewScheduled = (bool) ($this->has_scheduled_round ?? false);

        if ($this->status === ApplicationStatus::Shortlisted && $interviewScheduled) {
            return 'interview_scheduled';
        }

        return match ($this->status) {
            ApplicationStatus::Applied => 'applied',
            ApplicationStatus::UnderReview => 'in_review',
            ApplicationStatus::Shortlisted => 'shortlisted',
            ApplicationStatus::Rejected => 'closed',
        };
    }

    public function statusHistories(): HasMany
    {
        return $this->hasMany(ApplicationStatusHistory::class);
    }

    public function emailLogs(): HasMany
    {
        return $this->hasMany(EmailLog::class);
    }

    public function latestRound(): HasOne
    {
        return $this->hasOne(InterviewRound::class)->latestOfMany('round_number');
    }

    public function nextRound(): HasOne
    {
        return $this->hasOne(InterviewRound::class)->ofMany(
            ['scheduled_at' => 'min'],
            fn ($query) => $query->where('scheduled_at', '>=', now())->where('status', \App\Enums\RoundStatus::Scheduled),
        );
    }

    public function scopeOfType($query, ApplicationType|string $type)
    {
        return $query->where('type', $type);
    }

    public function scopeStatus($query, ApplicationStatus|string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeForEntity($query, int|string $entity)
    {
        return $query->where(function ($inner) use ($entity) {
            $inner->where('entity_id', $entity)
                ->orWhereHas('entity', fn ($entityQuery) => $entityQuery->where('slug', $entity));
        });
    }

    public function scopeAppliedBetween($query, $from, $to)
    {
        return $query->whereBetween('applied_at', [$from, $to]);
    }

    public function scopeFilter($query, array $filters)
    {
        return app(\App\Filters\HrApplicationFilter::class)->apply($query, $filters);
    }

    public function canTransitionTo(ApplicationStatus $status): bool
    {
        $allowed = match ($this->status) {
            ApplicationStatus::Applied => [ApplicationStatus::UnderReview, ApplicationStatus::Rejected],
            ApplicationStatus::UnderReview => [ApplicationStatus::Shortlisted, ApplicationStatus::Rejected],
            ApplicationStatus::Shortlisted => [ApplicationStatus::Rejected],
            ApplicationStatus::Rejected => [],
        };

        return in_array($status, $allowed, true);
    }

    protected function displayRole(): Attribute
    {
        return Attribute::get(function () {
            if ($this->type === ApplicationType::General) {
                $department = $this->relationLoaded('department')
                    ? $this->department
                    : $this->department()->first(['id', 'name']);

                return 'General – '.($department->name ?? 'department');
            }

            $job = $this->relationLoaded('jobPosting')
                ? $this->jobPosting
                : $this->jobPosting()->first(['id', 'title']);

            return $job->title ?? 'Application';
        });
    }
}
