<?php

namespace App\Notifications;

use App\Support\NotificationChannels;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Base class for HR portal notifications. Channels follow each user's preferences;
 * the payload powers both the in-app notification centre and the optional email.
 */
abstract class HrNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /** Notification type key, one of PermissionCatalog::NOTIFICATION_TYPES. */
    abstract public function type(): string;

    /**
     * @return array{title: string, message: string, url?: string|null, level?: string}
     */
    abstract protected function payload(): array;

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return NotificationChannels::for($notifiable, $this->type());
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $payload = $this->payload();

        return [
            'type' => $this->type(),
            'title' => $payload['title'],
            'message' => $payload['message'],
            'url' => $payload['url'] ?? null,
            'level' => $payload['level'] ?? 'info',
        ] + array_diff_key($payload, array_flip(['title', 'message', 'url', 'level']));
    }

    public function toMail(object $notifiable): MailMessage
    {
        $payload = $this->payload();
        $url = rtrim((string) config('app.frontend_portal_url'), '/').($payload['url'] ?? '/');

        return (new MailMessage)
            ->subject($payload['title'].' – Infolks Group HR')
            ->greeting('Hello '.($notifiable->name ?? '').',')
            ->line($payload['message'])
            ->action('Open in the HR portal', $url);
    }
}
