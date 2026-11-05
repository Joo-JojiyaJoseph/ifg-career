<?php

namespace App\Models;

use App\Support\Auditable;
use App\Support\HasContentOrder;
use Database\Factories\InterviewStepFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class InterviewStep extends Model
{
    /** @use HasFactory<InterviewStepFactory> */
    use Auditable, HasContentOrder, HasFactory, SoftDeletes;

    protected $fillable = ['name', 'description', 'sort_order', 'is_published'];

    public function casts(): array
    {
        return ['is_published' => 'boolean', 'sort_order' => 'integer'];
    }
}
