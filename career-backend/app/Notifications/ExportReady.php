<?php

namespace App\Notifications;

use App\Models\Export;

class ExportReady extends HrNotification
{
    public function __construct(public Export $export) {}

    public function type(): string
    {
        return 'export_ready';
    }

    protected function payload(): array
    {
        $label = str_replace('_', ' ', (string) $this->export->type);

        return [
            'title' => 'Export ready to download',
            'message' => 'Your '.$label.' export is ready. The link expires in 24 hours.',
            'url' => null,
            'level' => 'success',
            'export_id' => $this->export->id,
            'download_path' => '/api/v1/hr/exports/'.$this->export->id.'/download',
            'expires_at' => $this->export->expires_at?->toIso8601String(),
        ];
    }
}
