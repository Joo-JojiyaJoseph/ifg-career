<?php

namespace App\Mail;

use App\Enums\EmailType;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class QuickApplicationReceived extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $theme = 'infolks';

    public function __construct(
        public string $confirmation,
        public string $department,
        public string $careersUrl,
        public string $emailType = EmailType::QuickApplyConfirmation->value,
        public string $recipientEmail = '',
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'We received your application');
    }

    public function content(): Content
    {
        return new Content(markdown: 'mail.quick-apply-received');
    }
}
