<?php

namespace App\Models;

use App\Support\Auditable;
use App\Support\HasContentOrder;
use Database\Factories\RecognitionFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Recognition extends Model
{
    /** @use HasFactory<RecognitionFactory> */
    use Auditable, HasContentOrder, HasFactory, SoftDeletes;

    protected $fillable = ['name', 'year', 'badge_path', 'link', 'sort_order', 'is_published'];

    public function casts(): array
    {
        return ['is_published' => 'boolean', 'sort_order' => 'integer', 'year' => 'integer'];
    }
}
