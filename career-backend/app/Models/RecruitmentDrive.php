<?php

namespace App\Models;

use App\Support\Auditable;
use App\Support\HasContentOrder;
use Database\Factories\RecruitmentDriveFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class RecruitmentDrive extends Model
{
    /** @use HasFactory<RecruitmentDriveFactory> */
    use Auditable, HasContentOrder, HasFactory, SoftDeletes;

    protected $fillable = ['name', 'drive_date', 'caption', 'photo_path', 'sort_order', 'is_published'];

    public function casts(): array
    {
        return [
            'drive_date' => 'date',
            'is_published' => 'boolean',
            'sort_order' => 'integer',
        ];
    }
}
