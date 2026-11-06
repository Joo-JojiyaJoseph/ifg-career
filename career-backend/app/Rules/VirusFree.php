<?php

namespace App\Rules;

use App\Services\VirusScanner;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;

/**
 * Rejects an upload ClamAV reports as infected. Does nothing unless ClamAV is configured.
 * If ClamAV is configured but down, CLAMAV_FAIL_OPEN decides whether the upload is accepted.
 */
class VirusFree implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! $value instanceof UploadedFile) {
            return;
        }

        $scanner = app(VirusScanner::class);
        $result = $scanner->scan($value->getRealPath());

        if ($result === VirusScanner::INFECTED) {
            Log::warning('Upload rejected by virus scan', ['field' => $attribute]);
            $fail('This file did not pass our virus check. Please upload a different file.');

            return;
        }

        if ($result === VirusScanner::UNAVAILABLE && ! config('services.clamav.fail_open')) {
            Log::error('Virus scanner unavailable; upload refused', ['field' => $attribute]);
            $fail('We could not check this file right now. Please try again in a few minutes.');
        }
    }
}
