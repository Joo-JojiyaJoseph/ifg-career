<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * Serves published website images (/storage/...) when the web server cannot, for example when the
 * public/storage link is missing or points to an old folder. With a working link, the web server answers
 * these addresses itself and this is never reached. Only the public disk's own images are served.
 */
class PublicImageController extends Controller
{
    private const TYPES = ['webp' => 'image/webp', 'png' => 'image/png', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'gif' => 'image/gif', 'svg' => 'image/svg+xml'];

    public function __invoke(string $path): BinaryFileResponse
    {
        $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        abort_unless(isset(self::TYPES[$extension]) && ! str_contains($path, '..'), 404);

        $root = realpath(Storage::disk('public')->path(''));
        $file = realpath(Storage::disk('public')->path($path));
        abort_unless($root && $file && str_starts_with($file, $root.DIRECTORY_SEPARATOR) && is_file($file), 404);

        return response()->file($file, [
            'Content-Type' => self::TYPES[$extension],
            'Cache-Control' => 'public, max-age=604800',
            'X-Content-Type-Options' => 'nosniff',
            // SVGs are shown as images only; never run anything inside them.
            'Content-Security-Policy' => "default-src 'none'; style-src 'unsafe-inline'; sandbox",
        ]);
    }
}
