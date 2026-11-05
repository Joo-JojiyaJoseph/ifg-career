<?php

namespace App\Models;

use App\Support\Auditable;
use Database\Factories\EmployeeStoryFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class EmployeeStory extends Model
{
    /** @use HasFactory<EmployeeStoryFactory> */
    use Auditable, HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'role',
        'entity_id',
        'photo_path',
        'quote',
        'publish_permission_confirmed',
        'sort_order',
        'is_published',
    ];

    public function casts(): array
    {
        return [
            'publish_permission_confirmed' => 'boolean',
            'is_published' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function entity(): BelongsTo
    {
        return $this->belongsTo(Entity::class);
    }

    public function scopePublished($query)
    {
        return $query->where('is_published', true)->where('publish_permission_confirmed', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('id');
    }
}
