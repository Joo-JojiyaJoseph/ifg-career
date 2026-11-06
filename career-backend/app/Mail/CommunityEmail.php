<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Headers;
use Illuminate\Queue\SerializesModels;

/**
 * A talent community email (job alert or company update). Always carries an unsubscribe link
 * and one-click List-Unsubscribe headers (RFC 8058).
 */
class CommunityEmail extends Mailable
{
    use Queueable, SerializesModels;

    public $theme = 'infolks';

    /**
     * @param  list<array{title: string, entity: ?string, location: ?string, level: ?string, url: string, closes: ?string}>  $jobs
     */
    public function __construct(
        public string $emailType,
        public string $recipientEmail,
        public string $subjectLine,
        public string $recipientName,
        public ?string $bodyHtml,
        public array $jobs,
        public string $unsubscribeUrl,
        public string $oneClickUrl,
        public string $careersUrl,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->subjectLine);
    }

    public function headers(): Headers
    {
        return new Headers(text: [
            'List-Unsubscribe' => '<'.$this->oneClickUrl.'>, <'.$this->unsubscribeUrl.'>',
            'List-Unsubscribe-Post' => 'List-Unsubscribe=One-Click',
        ]);
    }

    public function content(): Content
    {
        return new Content(markdown: $this->emailType === 'job_alert' ? 'mail.job-alert' : 'mail.company-update');
    }
}
