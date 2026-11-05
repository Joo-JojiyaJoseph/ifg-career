<?php

namespace App\Models;

use App\Enums\ExportStatus;
use Database\Factories\ExportFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\URL;

class Export extends Model
{
    /** @use HasFactory<ExportFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'filters',
        'status',
        'row_count',
        'file_path',
        'expires_at',
    ];

    public function casts(): array
    {
        return [
            'filters' => 'array',
            'status' => ExportStatus::class,
            'expires_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function downloadUrl(): ?string
    {
        if (blank($this->file_path) || ! \Illuminate\Support\Facades\Route::has('hr.exports.download')) {
            return null;
        }

        return URL::temporarySignedRoute('hr.exports.download', now()->addMinutes(5), [
            'export' => $this->getKey(),
        ]);
    }
}
