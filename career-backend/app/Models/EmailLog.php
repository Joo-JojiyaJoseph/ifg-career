<?php

namespace App\Models;

use App\Enums\EmailType;
use Database\Factories\EmailLogFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmailLog extends Model
{
    /** @use HasFactory<EmailLogFactory> */
    use HasFactory;

    protected $fillable = [
        'type',
        'recipient_email',
        'candidate_id',
        'talent_member_id',
        'job_posting_id',
        'campaign_id',
        'application_id',
        'status',
        'error',
        'sent_at',
    ];

    public function casts(): array
    {
        return [
            'type' => EmailType::class,
            'sent_at' => 'datetime',
        ];
    }

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(Candidate::class);
    }

    public function talentMember(): BelongsTo
    {
        return $this->belongsTo(TalentMember::class);
    }

    public function jobPosting(): BelongsTo
    {
        return $this->belongsTo(JobPosting::class);
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }

    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }
}
