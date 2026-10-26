<?php

namespace App\Notifications\Admin;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

final class AdminSendCredentials extends Notification
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
            ->subject(__('Welcome to :app', ['app' => config('app.name')]))
            ->greeting(__('Hello :name', ['name' => $notifiable->full_name ?? $notifiable->name]))
            ->line(__('An account has been created for you as Administrator on the website :website', ['website' => config('app.url')]))
            ->line(__('Email: :email - Password: :password', ['email' => $notifiable->email, 'password' => $this->password]))
            ->line(__('You can use the following link to login:'))
            ->action(__('Login'), route('admin.login'))
            ->line(__('After logging in you need to change your password.'));
    }
}
