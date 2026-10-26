<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BrandedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public string $template,
        public string $subject,
        public array $data = [],
    ) {}

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject($this->subject)
            ->view(["emails.{$this->template}", "emails.{$this->template}-text"], $this->data + [
                'name' => $notifiable->name ?? '',
                'appName' => config('app.name'),
            ]);
    }
}