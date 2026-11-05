<?php

namespace App\Models;

use Database\Factories\SavedFilterFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SavedFilter extends Model
{
    /** @use HasFactory<SavedFilterFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'screen',
        'name',
        'query',
        'is_default',
        'is_shared',
    ];

    public function casts(): array
    {
        return [
            'query' => 'array',
            'is_default' => 'boolean',
            'is_shared' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeVisibleTo(Builder $query, User $user)
    {
        return $query->where(function (Builder $inner) use ($user) {
            $inner->where('user_id', $user->id)->orWhere('is_shared', true);
        });
    }
}
