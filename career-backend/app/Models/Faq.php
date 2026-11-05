<?php

namespace App\Models;

use App\Support\Auditable;
use App\Support\HasContentOrder;
use Database\Factories\FaqFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Faq extends Model
{
    /** @use HasFactory<FaqFactory> */
    use Auditable, HasContentOrder, HasFactory, SoftDeletes;

    protected $fillable = ['question', 'answer', 'sort_order', 'is_published'];

    public function casts(): array
    {
        return ['is_published' => 'boolean', 'sort_order' => 'integer'];
    }
}
