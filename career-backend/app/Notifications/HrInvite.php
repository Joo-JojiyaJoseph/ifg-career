<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class HrInvite extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public string $token, public string $invitedBy) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = rtrim((string) config('app.frontend_portal_url'), '/')
            .'/reset-password?token='.$this->token.'&email='.urlencode($notifiable->email).'&invite=1';

        return (new MailMessage)
            ->subject('You have been invited to the Infolks Group HR portal')
            ->greeting('Hello '.$notifiable->name.',')
            ->line($this->invitedBy.' added you to the Infolks Group HR recruitment portal.')
            ->action('Set your password', $url)
            ->line('This link expires in 60 minutes. Ask an Admin to send a new one if it runs out.');
    }
}
