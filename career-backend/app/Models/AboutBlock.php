<?php

namespace App\Models;

use App\Support\Auditable;
use App\Support\HasContentOrder;
use Database\Factories\AboutBlockFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class AboutBlock extends Model
{
    /** @use HasFactory<AboutBlockFactory> */
    use Auditable, HasContentOrder, HasFactory, SoftDeletes;

    protected $fillable = ['title', 'body', 'heroicon_name', 'sort_order', 'is_published'];

    public function casts(): array
    {
        return ['is_published' => 'boolean', 'sort_order' => 'integer'];
    }
}
