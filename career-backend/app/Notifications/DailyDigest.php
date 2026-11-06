<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;

class DailyDigest extends HrNotification
{
    /**
     * @param  array{applications: int, quick_apply: int, interviews_today: int, closing_soon: int, sync_failed: int}  $stats
     */
    public function __construct(public array $stats) {}

    public function type(): string
    {
        return 'daily_digest';
    }

    protected function payload(): array
    {
        return [
            'title' => 'Your daily hiring digest',
            'message' => $this->stats['applications'].' new applications yesterday and '.$this->stats['interviews_today'].' interviews today.',
            'url' => '/',
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $portal = rtrim((string) config('app.frontend_portal_url'), '/');

        return (new MailMessage)
            ->subject('Daily hiring digest – Infolks Group HR')
            ->greeting('Good morning '.($notifiable->name ?? '').',')
            ->line('Here is what needs attention today:')
            ->line('• New applications yesterday: '.$this->stats['applications'])
            ->line('• Quick apply applications awaiting review: '.$this->stats['quick_apply'])
            ->line('• Interviews today: '.$this->stats['interviews_today'])
            ->line('• Jobs closing in the next 7 days: '.$this->stats['closing_soon'])
            ->line('• Calendar syncs that need a retry: '.$this->stats['sync_failed'])
            ->action('Open the HR portal', $portal.'/')
            ->line('You can turn this email off in Notification preferences.');
    }
}
