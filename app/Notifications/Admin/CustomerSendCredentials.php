<?php

namespace App\Notifications\Admin;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

final class CustomerSendCredentials extends Notification
{
    public function __construct(
        public string $password
    ) {}

    /**
     * @return array<string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject(__('Welcome to :name', ['name' => config('app.name')]))
            ->greeting(__('Hello :name', ['name' => $notifiable->full_name ?? $notifiable->name]))
            ->line(__('An account has been created for you on the website :website', ['website' => config('app.url')]))
            ->line(__('Email: :email - Password: :password', ['email' => $notifiable->email, 'password' => $this->password]))
            ->line(__('You can access to the website to login'))
            ->action(__('Browse the website'), url('/'))
            ->line(__('After logging in you have to change your password.'));
    }
}
