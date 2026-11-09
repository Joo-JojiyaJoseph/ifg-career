<?php

namespace App\Models;

use App\Support\Auditable;
use Database\Factories\DepartmentFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Department extends Model
{
    /** @use HasFactory<DepartmentFactory> */
    use Auditable, HasFactory, SoftDeletes;

    protected $fillable = [
        'entity_id',
        'name',
        'is_active',
        'sort_order',
    ];

    public function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }

    public function entity(): BelongsTo
    {
        return $this->belongsTo(Entity::class);
    }

    /** Departments for one company: its own plus the group-wide ones. */
    public function scopeForEntity($query, ?int $entityId)
    {
        return $query->where(fn ($inner) => $inner->whereNull('entity_id')->when($entityId, fn ($q) => $q->orWhere('entity_id', $entityId)));
    }

    public function teams(): HasMany
    {
        return $this->hasMany(Team::class);
    }

    public function jobPostings(): HasMany
    {
        return $this->hasMany(JobPosting::class);
    }

    public function applications(): HasMany
    {
        return $this->hasMany(Application::class);
    }

    public function candidates(): HasMany
    {
        return $this->hasMany(Candidate::class, 'preferred_department_id');
    }
}
