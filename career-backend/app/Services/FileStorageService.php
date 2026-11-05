<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FileStorageService
{
    public function storeResume(UploadedFile $file): string
    {
        return $file->store('resumes', 'private');
    }

    public function copyResume(string $path): string
    {
        $extension = pathinfo($path, PATHINFO_EXTENSION);
        $target = 'resumes/'.Str::ulid().($extension !== '' ? '.'.$extension : '');
        Storage::disk('private')->copy($path, $target);

        return $target;
    }

    public function delete(?string $path): void
    {
        if (filled($path) && Storage::disk('private')->exists($path)) {
            Storage::disk('private')->delete($path);
        }
    }

    public function originalName(UploadedFile $file): string
    {
        $name = basename($file->getClientOriginalName());
        $name = preg_replace('/[^\w.\- ]+/u', '', $name) ?: 'resume';

        return mb_substr($name, 0, 150);
    }
}
