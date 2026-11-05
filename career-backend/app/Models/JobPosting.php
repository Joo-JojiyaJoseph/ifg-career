<?php

namespace App\Models;

use App\Enums\JobLevel;
use App\Enums\JobStatus;
use App\Support\Auditable;
use App\Support\HasPublicId;
use Database\Factories\JobPostingFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class JobPosting extends Model
{
    /** @use HasFactory<JobPostingFactory> */
    use Auditable, HasFactory, HasPublicId, SoftDeletes;

    protected $fillable = [
        'public_id',
        'title',
        'slug',
        'role_key',
        'entity_id',
        'department_id',
        'team_id',
        'level',
        'location',
        'summary',
        'qualification',
        'experience',
        'why_join_us',
        'last_date_to_apply',
        'status',
        'posted_at',
        'published_at',
        'closed_at',
        'created_by',
        'updated_by',
    ];

    public function casts(): array
    {
        return [
            'level' => JobLevel::class,
            'status' => JobStatus::class,
            'last_date_to_apply' => 'date',
            'posted_at' => 'datetime',
            'published_at' => 'datetime',
            'closed_at' => 'datetime',
        ];
    }

    public function entity(): BelongsTo
    {
        return $this->belongsTo(Entity::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function skills(): BelongsToMany
    {
        return $this->belongsToMany(Skill::class, 'job_posting_skill');
    }

    public function campaigns(): BelongsToMany
    {
        return $this->belongsToMany(Campaign::class, 'campaign_job_posting');
    }

    public function applications(): HasMany
    {
        return $this->hasMany(Application::class);
    }

    public function emailLogs(): HasMany
    {
        return $this->hasMany(EmailLog::class);
    }

    public function scopePublished($query)
    {
        return $query->where('status', JobStatus::Published);
    }

    public function scopeOpen($query)
    {
        return $query->where('status', JobStatus::Published)
            ->whereDate('last_date_to_apply', '>=', today());
    }

    public function scopeSearch($query, ?string $term)
    {
        if (blank($term)) {
            return $query;
        }

        return $query->where(function (Builder $inner) use ($term) {
            if ($inner->getConnection()->getDriverName() === 'mysql') {
                $inner->whereFullText(['title', 'summary'], $term);
            } else {
                $inner->where('title', 'like', '%'.$term.'%')
                    ->orWhere('summary', 'like', '%'.$term.'%');
            }

            $inner->orWhereHas('skills', fn ($skills) => $skills->where('name', 'like', '%'.$term.'%'))
                ->orWhereHas('entity', fn ($entity) => $entity->where('name', 'like', '%'.$term.'%'));
        });
    }

    public function scopeFilter($query, array $filters)
    {
        return $query
            ->when($filters['search'] ?? null, fn ($q, $search) => $q->search($search))
            ->when($filters['entity'] ?? $filters['entity_id'] ?? null, function ($q, $entity) {
                $q->whereHas('entity', function ($inner) use ($entity) {
                    $inner->where('slug', $entity)->orWhere('id', $entity);
                });
            })
            ->when($filters['department_id'] ?? null, fn ($q, $id) => $q->where('department_id', $id))
            ->when($filters['team_id'] ?? null, fn ($q, $id) => $q->where('team_id', $id))
            ->when($filters['level'] ?? null, fn ($q, $level) => $q->where('level', $level))
            ->when($filters['location'] ?? null, fn ($q, $location) => $q->where('location', $location))
            ->when($filters['status'] ?? null, fn ($q, $status) => $q->where('status', $status))
            ->when($filters['skill'] ?? null, fn ($q, $skill) => $q->whereHas('skills', fn ($inner) => $inner->where('slug', $skill)->orWhere('name', $skill)))
            ->when($filters['created_by'] ?? null, fn ($q, $id) => $q->where('created_by', $id))
            ->when($filters['posted_from'] ?? null, fn ($q, $date) => $q->whereDate('posted_at', '>=', $date))
            ->when($filters['posted_to'] ?? null, fn ($q, $date) => $q->whereDate('posted_at', '<=', $date))
            ->when($filters['last_date_from'] ?? null, fn ($q, $date) => $q->whereDate('last_date_to_apply', '>=', $date))
            ->when($filters['last_date_to'] ?? null, fn ($q, $date) => $q->whereDate('last_date_to_apply', '<=', $date))
            ->when($filters['closing_within'] ?? null, fn ($q, $days) => $q->closingWithin((int) $days))
            ->when(($filters['has_applications'] ?? null) !== null && $filters['has_applications'] !== '', function ($q) use ($filters) {
                filter_var($filters['has_applications'], FILTER_VALIDATE_BOOLEAN)
                    ? $q->has('applications')
                    : $q->doesntHave('applications');
            });
    }

    public function scopeClosingWithin($query, int $days)
    {
        return $query->whereDate('last_date_to_apply', '>=', today())
            ->whereDate('last_date_to_apply', '<=', today()->addDays($days));
    }

    protected function isOpen(): Attribute
    {
        return Attribute::get(fn () => $this->status === JobStatus::Published
            && $this->last_date_to_apply !== null
            && $this->last_date_to_apply->startOfDay()->greaterThanOrEqualTo(today()));
    }

    protected function daysLeft(): Attribute
    {
        return Attribute::get(function () {
            if ($this->last_date_to_apply === null) {
                return null;
            }

            return (int) today()->diffInDays($this->last_date_to_apply->startOfDay(), false);
        });
    }

    protected function url(): Attribute
    {
        return Attribute::get(fn () => rtrim((string) config('app.frontend_careers_url'), '/')
            .'/jobs/'.$this->slug.'-'.$this->public_id);
    }
}
