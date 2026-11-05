<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class HrResetPassword extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public string $token) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = rtrim((string) config('app.frontend_portal_url'), '/')
            .'/reset-password?token='.$this->token
            .'&email='.urlencode($notifiable->email);

        return (new MailMessage)
            ->subject('Reset your Infolks Group HR password')
            ->greeting('Hello '.$notifiable->name.',')
            ->line('We received a request to reset the password for your Infolks Group HR portal account.')
            ->action('Choose a new password', $url)
            ->line('If you did not ask for this, you can ignore this email.');
    }
}
