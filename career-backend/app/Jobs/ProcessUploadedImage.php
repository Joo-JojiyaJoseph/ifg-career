<?php

namespace App\Jobs;

use App\Services\ImageService;
use App\Support\CacheVersion;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Finishes uploads saved before images were processed during the upload request ("pending:" paths).
 * New uploads no longer use it.
 */
class ProcessUploadedImage implements ShouldQueue
{
    use Queueable;

    public int $tries = 2;

    /**
     * @param  class-string<Model>  $modelClass
     */
    public function __construct(
        public string $modelClass,
        public int|string $modelId,
        public string $column,
        public string $pendingPath,
        public int $maxWidth = 1600,
    ) {}

    public function handle(ImageService $images): void
    {
        $model = $this->modelClass::query()->find($this->modelId);

        if (! $model || ImageService::read($model, $this->column) !== ImageService::PENDING.$this->pendingPath) {
            return;
        }

        try {
            $path = $images->process($this->pendingPath, $this->maxWidth);
        } catch (Throwable $exception) {
            Log::warning('Image processing failed', ['model' => class_basename($this->modelClass), 'id' => $this->modelId, 'error' => $exception->getMessage()]);
            $model->forceFill([$this->column => ''])->saveQuietly();

            return;
        }

        $model->forceFill([$this->column => $path])->save();
        CacheVersion::bump('content');
    }
}
