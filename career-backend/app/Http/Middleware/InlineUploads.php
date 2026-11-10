<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Both apps send files (images, resumes) as base64 data URLs inside the form instead of as file parts.
 * A form with no file parts never touches PHP's temporary upload folder, so uploads work even where
 * upload_tmp_dir is missing or not writable (a common Windows/Herd problem). This turns each data URL back
 * into an UploadedFile, written under storage/app, before validation, so every rule (mimes, max, VirusFree)
 * and every service sees an ordinary upload. The temporary copies are removed when the request ends.
 */
class InlineUploads
{
    /** Largest decoded file accepted here; the field's own "max" rule is usually stricter. */
    private const MAX_BYTES = 12 * 1024 * 1024;

    private const PATTERN = '/^data:([a-z0-9.+-]+\/[a-z0-9.+-]+)((?:;[a-z0-9-]+=[^;,]*)*);base64,/i';

    public function handle(Request $request, Closure $next): Response
    {
        $created = [];

        foreach ($request->request->all() as $key => $value) {
            if (! is_string($value) || ! str_starts_with($value, 'data:') || ! preg_match(self::PATTERN, $value, $match)) {
                continue;
            }

            $payload = substr($value, strlen($match[0]));
            if (strlen($payload) > (int) ceil(self::MAX_BYTES * 4 / 3) + 4) {
                // Leave it as text: the field's "file" rule then explains that it is not a valid upload.
                continue;
            }

            $bytes = base64_decode($payload, true);
            if ($bytes === false) {
                continue;
            }

            $name = $this->name($match[2], $match[1]);
            $folder = storage_path('app/inline-uploads');
            if (! is_dir($folder)) {
                mkdir($folder, 0775, true);
            }

            $path = $folder.DIRECTORY_SEPARATOR.Str::random(40).'.'.(pathinfo($name, PATHINFO_EXTENSION) ?: 'bin');
            file_put_contents($path, $bytes);
            $created[] = $path;

            $request->request->remove($key);
            $request->files->set($key, new UploadedFile($path, $name, $match[1], UPLOAD_ERR_OK, true));
        }

        try {
            return $next($request);
        } finally {
            foreach ($created as $path) {
                if (is_file($path)) {
                    @unlink($path);
                }
            }
        }
    }

    /** The original file name from ";name=…", made safe; otherwise one built from the type. */
    private function name(string $parameters, string $mime): string
    {
        if (preg_match('/;name=([^;,]*)/i', $parameters, $match)) {
            $name = basename(str_replace('\\', '/', rawurldecode($match[1])));
            $name = preg_replace('/[^\w.\- ()]+/u', '_', $name) ?? '';
            if ($name !== '' && $name !== '.' && $name !== '..') {
                return Str::limit($name, 120, '');
            }
        }

        $extension = match (strtolower($mime)) {
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            'image/svg+xml' => 'svg',
            'image/gif' => 'gif',
            'application/pdf' => 'pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'docx',
            default => 'bin',
        };

        return 'upload.'.$extension;
    }
}
