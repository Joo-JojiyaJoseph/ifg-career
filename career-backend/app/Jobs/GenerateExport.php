<?php

namespace App\Jobs;

use App\Models\Export;
use App\Services\ExportService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class GenerateExport implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public function __construct(public int $exportId) {}

    public function handle(ExportService $exports): void
    {
        $export = Export::query()->with('user')->find($this->exportId);

        if (! $export) {
            return;
        }

        $exports->generate($export);
    }
}
