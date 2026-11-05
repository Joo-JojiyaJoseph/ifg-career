<?php

namespace App\Listeners;

use App\Models\EmailLog;
use Illuminate\Mail\Events\MessageSent;

class LogSentEmail
{
    public function handle(MessageSent $event): void
    {
        $type = $event->data['emailType'] ?? null;
        $email = $event->data['recipientEmail'] ?? null;

        if (! is_string($type) || ! is_string($email)) {
            return;
        }

        $log = EmailLog::query()
            ->where('type', $type)
            ->where('recipient_email', $email)
            ->where('status', 'queued')
            ->latest('id')
            ->first();

        $log?->update([
            'status' => 'sent',
            'sent_at' => now(),
        ]);
    }
}
