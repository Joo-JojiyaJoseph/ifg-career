<?php

namespace App\Services;

use App\Support\CacheVersion;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Website images (stories, drives, badges, banners, logos).
 *
 * Each upload is re-encoded (which strips EXIF/location data), resized and published to the public disk during
 * the upload request itself, so it shows at once. (Older uploads may still hold a "pending:" path that the
 * ProcessUploadedImage job finishes; the public API never exposes those.)
 */
class ImageService
{
    public const PENDING = 'pending:';

    /** Whether a stored value is an upload still waiting for the background worker. */
    public static function isPending(mixed $path): bool
    {
        return is_string($path) && str_starts_with($path, self::PENDING);
    }

    public function save(UploadedFile $file, Model $model, string $column, int $maxWidth = 1600): void
    {
        // guessExtension() needs PHP's fileinfo extension; fall back to the file name when it is missing.
        try {
            $extension = strtolower($file->guessExtension() ?: $file->getClientOriginalExtension());
        } catch (\Throwable) {
            $extension = strtolower($file->getClientOriginalExtension());
        }

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

        // Processed straight away while the upload request runs (no background worker needed), so the image is
        // on the site as soon as the save finishes. A file that is not a readable image is refused here.
        $pending = $file->store('uploads/pending', 'private');
        $path = $this->process($pending, $maxWidth);
        $this->replace($model, $column, $path);
        CacheVersion::bump('content');
    }

    /**
     * Re-encode one pending upload and publish it. Returns the public path.
     */
    public function process(string $pendingPath, int $maxWidth): string
    {
        $disk = Storage::disk('private');
        $raw = $disk->get($pendingPath);

        if ($raw === null) {
            throw new RuntimeException('The uploaded image is missing.');
        }

        // Without PHP's GD extension (or a GD build that cannot read this format), publish the file as uploaded
        // rather than failing. It is not resized or stripped of metadata, so enabling GD is still recommended.
        $image = function_exists('imagecreatefromstring') ? @imagecreatefromstring($raw) : false;

        if ($image === false) {
            $type = self::sniff($raw);

            if ($type === null) {
                $disk->delete($pendingPath);
                throw new RuntimeException('The image could not be read.');
            }

            Log::warning('Image published without processing; enable the GD extension with WebP support', ['type' => $type]);
            $path = 'content/'.Str::ulid().'.'.$type;
            Storage::disk('public')->put($path, $raw);
            $disk->delete($pendingPath);

            return $path;
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

    /**
     * The image type from the file's first bytes: jpg, png, webp or gif, or null if it is not an image.
     */
    public static function sniff(string $bytes): ?string
    {
        return match (true) {
            str_starts_with($bytes, "\xFF\xD8\xFF") => 'jpg',
            str_starts_with($bytes, "\x89PNG\r\n\x1A\n") => 'png',
            str_starts_with($bytes, 'RIFF') && substr($bytes, 8, 4) === 'WEBP' => 'webp',
            str_starts_with($bytes, 'GIF8') => 'gif',
            default => null,
        };
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

        // During a web request, use the address the request came in on (for example http://career-backend.test),
        // so images work even when APP_URL in .env does not match. Elsewhere (emails, jobs), use APP_URL.
        if (app()->bound('request') && request()->headers->has('host')) {
            return url('storage/'.ltrim($path, '/'));
        }

        return Storage::disk('public')->url($path);
    }
}
