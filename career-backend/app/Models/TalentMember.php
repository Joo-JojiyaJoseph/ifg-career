<?php

namespace App\Models;

use App\Enums\TalentSource;
use Database\Factories\TalentMemberFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

class TalentMember extends Model
{
    /** @use HasFactory<TalentMemberFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'candidate_id',
        'source',
        'is_subscribed',
        'unsubscribe_token',
        'subscribed_at',
        'unsubscribed_at',
        'privacy_consent_at',
    ];

    public function casts(): array
    {
        return [
            'source' => TalentSource::class,
            'is_subscribed' => 'boolean',
            'subscribed_at' => 'datetime',
            'unsubscribed_at' => 'datetime',
            'privacy_consent_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (self $member): void {
            if (blank($member->unsubscribe_token)) {
                $member->unsubscribe_token = Str::random(64);
            }

            $member->subscribed_at ??= now();
        });
    }

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(Candidate::class);
    }

    public function emailLogs(): HasMany
    {
        return $this->hasMany(EmailLog::class);
    }

    public function scopeSubscribed($query)
    {
        return $query->where('is_subscribed', true);
    }

    public function unsubscribeUrl(): string
    {
        return URL::temporarySignedRoute(
            'public.unsubscribe',
            now()->addYear(),
            ['token' => $this->unsubscribe_token],
        );
    }
}
