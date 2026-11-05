<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class HrNewDeviceLogin extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public string $ip) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('New sign-in to the Infolks Group HR portal')
            ->greeting('Hello '.$notifiable->name.',')
            ->line('Your HR portal account was just used from a new IP address: '.$this->ip.'.')
            ->line('If this was not you, reset your password and contact an Admin.');
    }
}
