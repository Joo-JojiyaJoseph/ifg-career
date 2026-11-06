<?php

namespace App\Services;

use App\Jobs\ProcessUploadedImage;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Website images (stories, drives, badges, banners, logos).
 *
 * Uploads land on the private disk first. A queued job re-encodes them (which strips EXIF/location data),
 * resizes them and moves them to the public disk. Until then the column holds a "pending:" path that the
 * public API never exposes.
 */
class ImageService
{
    public const PENDING = 'pending:';

    public function queue(UploadedFile $file, Model $model, string $column, int $maxWidth = 1600): void
    {
        $extension = strtolower($file->guessExtension() ?: $file->getClientOriginalExtension());

        if ($extension === 'svg') {
            // SVG logos and patterns are text; store them directly after a basic safety check.
            $contents = (string) file_get_contents($file->getRealPath());

            if (preg_match('/<script|on\w+\s*=|javascript:|<foreignObject/i', $contents)) {
                throw new RuntimeException('This SVG contains scripts and cannot be used.');
            }

            $path = 'content/'.Str::ulid().'.svg';
            Storage::disk('public')->put($path, $contents);
            $this->replace($model, $column, $path);

            return;
        }

        $pending = $file->store('uploads/pending', 'private');
        $old = self::read($model, $column);
        $model->forceFill([$column => self::PENDING.$pending])->save();
        $this->deleteStored(is_string($old) ? $old : null);

        ProcessUploadedImage::dispatch($model::class, $model->getKey(), $column, $pending, $maxWidth);
    }

    /**
     * Re-encode one pending upload and publish it. Returns the public path.
     */
    public function process(string $pendingPath, int $maxWidth): string
    {
        $disk = Storage::disk('private');
        $raw = $disk->get($pendingPath);
        $image = $raw !== null ? @imagecreatefromstring($raw) : false;

        if ($image === false) {
            $disk->delete($pendingPath);
            throw new RuntimeException('The image could not be read.');
        }

        $width = imagesx($image);
        $height = imagesy($image);

        // Always redraw onto a fresh canvas: this drops EXIF/GPS metadata and resizes in one step.
        $targetWidth = min($width, $maxWidth);
        $targetHeight = (int) max(1, round($height * ($targetWidth / max(1, $width))));
        $canvas = imagecreatetruecolor($targetWidth, $targetHeight);
        imagealphablending($canvas, false);
        imagesavealpha($canvas, true);
        imagefill($canvas, 0, 0, imagecolorallocatealpha($canvas, 0, 0, 0, 127));
        imagecopyresampled($canvas, $image, 0, 0, 0, 0, $targetWidth, $targetHeight, $width, $height);
        imagedestroy($image);
        $image = $canvas;

        ob_start();
        $webp = function_exists('imagewebp') && imagewebp($image, null, 82);
        if (! $webp) {
            imagepng($image, null, 8);
        }
        $encoded = (string) ob_get_clean();
        imagedestroy($image);

        $path = 'content/'.Str::ulid().($webp ? '.webp' : '.png');
        Storage::disk('public')->put($path, $encoded);
        $disk->delete($pendingPath);

        return $path;
    }

    public function replace(Model $model, string $column, ?string $path): void
    {
        $old = self::read($model, $column);
        $model->forceFill([$column => $path])->save();
        $this->deleteStored($old);
    }

    public function deleteStored(?string $path): void
    {
        if (blank($path) || str_starts_with($path, '/') || str_starts_with($path, 'http')) {
            return;
        }

        if (str_starts_with($path, self::PENDING)) {
            Storage::disk('private')->delete(substr($path, strlen(self::PENDING)));

            return;
        }

        Storage::disk('public')->delete($path);
    }

    /**
     * Read a column, including a JSON path such as "value->banner_image".
     */
    public static function read(Model $model, string $column): mixed
    {
        if (str_contains($column, '->')) {
            [$attribute, $path] = explode('->', $column, 2);

            return data_get($model->getAttribute($attribute), str_replace('->', '.', $path));
        }

        return $model->getAttribute($column);
    }

    /**
     * Public URL for a stored path, or null while it is still being processed.
     */
    public static function url(?string $path): ?string
    {
        if (blank($path) || str_starts_with($path, self::PENDING)) {
            return null;
        }

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://') || str_starts_with($path, '/')) {
            return $path;
        }

        return Storage::disk('public')->url($path);
    }
}
