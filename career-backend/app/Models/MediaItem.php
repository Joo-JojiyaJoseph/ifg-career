<?php

namespace App\Models;

use App\Enums\MediaType;
use App\Support\Auditable;
use App\Support\HasContentOrder;
use Database\Factories\MediaItemFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class MediaItem extends Model
{
    /** @use HasFactory<MediaItemFactory> */
    use Auditable, HasContentOrder, HasFactory, SoftDeletes;

    protected $fillable = ['type', 'title', 'youtube_url', 'photo_path', 'caption', 'sort_order', 'is_published'];

    public function casts(): array
    {
        return [
            'type' => MediaType::class,
            'is_published' => 'boolean',
            'sort_order' => 'integer',
        ];
    }
}
