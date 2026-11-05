<?php

namespace App\Models;

use App\Enums\ColourTag;
use App\Enums\Gender;
use App\Enums\SignupSource;
use App\Support\Auditable;
use App\Support\HasPublicId;
use Database\Factories\CandidateFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class Candidate extends Authenticatable
{
    /** @use HasFactory<CandidateFactory> */
    use Auditable, HasFactory, HasPublicId, Notifiable;

    protected $fillable = [
        'public_id',
        'google_id',
        'avatar_url',
        'email',
        'email_verified_at',
        'name',
        'date_of_birth',
        'phone',
        'location',
        'gender',
        'highest_qualification',
        'preferred_department_id',
        'years_experience',
        'current_ctc',
        'expected_ctc',
        'reference_id',
        'linkedin_url',
        'portfolio_url',
        'resume_path',
        'resume_original_name',
        'resume_uploaded_at',
        'signup_source',
        'profile_completed_at',
        'colour_tag',
        'is_blacklisted',
        'blacklisted_at',
        'blacklist_until',
        'blacklist_reason',
        'blacklisted_by',
        'privacy_consent_at',
        'last_login_at',
    ];

    protected $hidden = [
        'google_id',
        'remember_token',
    ];

    public function casts(): array
    {
        return [
            'date_of_birth' => 'date',
            'years_experience' => 'decimal:1',
            'current_ctc' => 'decimal:2',
            'expected_ctc' => 'decimal:2',
            'gender' => Gender::class,
            'colour_tag' => ColourTag::class,
            'signup_source' => SignupSource::class,
            'is_blacklisted' => 'boolean',
            'email_verified_at' => 'datetime',
            'resume_uploaded_at' => 'datetime',
            'profile_completed_at' => 'datetime',
            'blacklisted_at' => 'datetime',
            'blacklist_until' => 'datetime',
            'privacy_consent_at' => 'datetime',
            'last_login_at' => 'datetime',
        ];
    }

    public function getAuthPassword(): string
    {
        return '';
    }

    public function applications(): HasMany
    {
        return $this->hasMany(Application::class);
    }

    public function latestApplication(): HasOne
    {
        return $this->hasOne(Application::class)->latestOfMany('applied_at');
    }

    public function notes(): HasMany
    {
        return $this->hasMany(CandidateNote::class)->latest();
    }

    public function roleBlocks(): HasMany
    {
        return $this->hasMany(RoleBlock::class);
    }

    public function activeRoleBlocks(): HasMany
    {
        return $this->roleBlocks()->active();
    }

    public function emailLogs(): HasMany
    {
        return $this->hasMany(EmailLog::class);
    }

    public function talentMember(): HasOne
    {
        return $this->hasOne(TalentMember::class);
    }

    public function preferredDepartment(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'preferred_department_id');
    }

    public function blacklistedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'blacklisted_by');
    }

    public function jobPostings(): BelongsToMany
    {
        return $this->belongsToMany(JobPosting::class, 'applications')
            ->withPivot(['applied_at', 'status']);
    }

    public function scopeBlacklistedNow($query)
    {
        return $query->where('is_blacklisted', true)
            ->where(function (Builder $inner) {
                $inner->whereNull('blacklist_until')->orWhere('blacklist_until', '>', now());
            });
    }

    public function scopeSearch($query, ?string $term)
    {
        if (blank($term)) {
            return $query;
        }

        return $query->where(function (Builder $inner) use ($term) {
            if ($inner->getConnection()->getDriverName() === 'mysql') {
                $inner->whereFullText(['name', 'email'], $term)
                    ->orWhere('phone', 'like', '%'.$term.'%');
            } else {
                $inner->where('name', 'like', '%'.$term.'%')
                    ->orWhere('email', 'like', '%'.$term.'%')
                    ->orWhere('phone', 'like', '%'.$term.'%');
            }
        });
    }

    public function scopeFilter($query, array $filters)
    {
        return app(\App\Filters\CandidateFilter::class)->apply($query, $filters);
    }

    public function isProfileComplete(): bool
    {
        return $this->profile_completion_percent === 100;
    }

    protected function age(): Attribute
    {
        return Attribute::get(fn () => $this->date_of_birth?->age);
    }

    protected function isBlacklistedNow(): Attribute
    {
        return Attribute::get(fn () => $this->is_blacklisted
            && ($this->blacklist_until === null || $this->blacklist_until->isFuture()));
    }

    protected function profileCompletionPercent(): Attribute
    {
        return Attribute::get(function () {
            $checks = [
                filled($this->name),
                filled($this->email),
                filled($this->date_of_birth),
                filled($this->phone),
                filled($this->location),
                filled($this->gender),
                filled($this->highest_qualification),
                filled($this->preferred_department_id),
                $this->years_experience !== null,
                $this->current_ctc !== null,
                $this->expected_ctc !== null,
                filled($this->resume_path),
            ];

            $done = count(array_filter($checks));

            return (int) round($done / count($checks) * 100);
        });
    }

    protected function initials(): Attribute
    {
        return Attribute::get(function () {
            $parts = preg_split('/\s+/', trim((string) $this->name)) ?: [];
            $letters = '';

            foreach (array_slice($parts, 0, 2) as $part) {
                $letters .= mb_strtoupper(mb_substr($part, 0, 1));
            }

            return $letters !== '' ? $letters : '?';
        });
    }
}
