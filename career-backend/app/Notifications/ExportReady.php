<?php

namespace App\Notifications;

use App\Models\Export;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ExportReady extends Notification
{
    use Queueable;

    public function __construct(public Export $export) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $label = str_replace('_', ' ', (string) $this->export->type);

        return [
            'type' => 'export_ready',
            'title' => 'Export ready to download',
            'message' => 'Your '.$label.' export is ready. The link expires in 24 hours.',
            'export_id' => $this->export->id,
            'expires_at' => $this->export->expires_at?->toIso8601String(),
        ];
    }
}
