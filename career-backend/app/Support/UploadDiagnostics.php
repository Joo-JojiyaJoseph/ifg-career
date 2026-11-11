<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * Turns PHP's upload error codes into messages that say what to fix, and reports the server's upload settings
 * for System health. "Upload failed" covers several different problems, and only some are about file size.
 */
class UploadDiagnostics
{
    public static function message(string $attribute, mixed $file): string
    {
        $code = $file instanceof UploadedFile ? $file->getError() : null;

        return match ($code) {
            UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => "The {$attribute} is larger than this server accepts (".ini_get('upload_max_filesize').'). Choose a smaller file, or raise upload_max_filesize and post_max_size in php.ini.',
            UPLOAD_ERR_PARTIAL => "The {$attribute} only partly arrived. Please try again.",
            UPLOAD_ERR_NO_FILE => "No file arrived for the {$attribute}. Choose the file again.",
            UPLOAD_ERR_NO_TMP_DIR => "The server has no temporary folder for uploads, so the {$attribute} could not be saved. Set upload_tmp_dir in php.ini to a folder that exists, then restart PHP.",
            UPLOAD_ERR_CANT_WRITE => "The server could not write the {$attribute} to its temporary upload folder. Check that the folder in upload_tmp_dir exists and is writable, and that the disk is not full.",
            UPLOAD_ERR_EXTENSION => "A PHP extension on the server stopped the {$attribute} upload.",
            default => "The {$attribute} could not be uploaded (PHP upload error ".($code ?? 'unknown').').',
        };
    }

    /**
     * @return array{file_uploads: bool, upload_max_filesize: string, post_max_size: string, tmp_dir: string, tmp_dir_writable: bool, ok: bool}
     */
    public static function settings(): array
    {
        $tmp = ini_get('upload_tmp_dir') ?: sys_get_temp_dir();
        $uploads = filter_var(ini_get('file_uploads'), FILTER_VALIDATE_BOOL);
        $writable = is_dir($tmp) && is_writable($tmp);
        $bytes = fn (string $value) => (int) $value * match (strtolower(substr(trim($value), -1))) {
            'g' => 1 << 30, 'm' => 1 << 20, 'k' => 1 << 10, default => 1
        };
        $max = (string) ini_get('upload_max_filesize');

        // Images are published to the public disk; the site serves them through public/storage.
        // A link left over from an older copy of the project can point to a folder that no longer exists.
        $link = public_path('storage');
        $target = realpath(storage_path('app/public'));
        $linked = (is_link($link) || is_dir($link)) && $target !== false && realpath($link) === $target;

        return [
            'file_uploads' => $uploads,
            'upload_max_filesize' => $max,
            'post_max_size' => (string) ini_get('post_max_size'),
            'post_max_ok' => $bytes((string) ini_get('post_max_size')) >= 8 << 20,
            'tmp_dir' => $tmp,
            // The portal and careers site send files inside the form, so PHP's temporary folder is no longer needed.
            'tmp_dir_writable' => $writable,
            'storage_linked' => $linked,
            'public_url' => rtrim(Storage::disk('public')->url(''), '/'),
            'ok' => $uploads && $linked && $bytes((string) ini_get('post_max_size')) >= 8 << 20,
        ];
    }
}
