<?php

namespace App\Models;

use Database\Factories\CandidateNoteFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CandidateNote extends Model
{
    /** @use HasFactory<CandidateNoteFactory> */
    use HasFactory;

    protected $fillable = [
        'candidate_id',
        'user_id',
        'body',
    ];

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(Candidate::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
