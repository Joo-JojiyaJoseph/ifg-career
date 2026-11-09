<?php

namespace App\Models;

use App\Support\Auditable;
use Database\Factories\SkillFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Str;

class Skill extends Model
{
    /** @use HasFactory<SkillFactory> */
    use Auditable, HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'is_active',
    ];

    public function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (self $skill): void {
            if (blank($skill->slug) && filled($skill->name)) {
                $skill->slug = Str::slug($skill->name);
            }
        });
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeSearch($query, ?string $term)
    {
        if (blank($term)) {
            return $query;
        }

        return $query->where('name', 'like', '%'.$term.'%');
    }

    public function jobPostings(): BelongsToMany
    {
        return $this->belongsToMany(JobPosting::class, 'job_posting_skill');
    }

    /** The companies that use this skill. None means every company. */
    public function entities(): BelongsToMany
    {
        return $this->belongsToMany(Entity::class);
    }
}
