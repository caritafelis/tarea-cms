<?php

namespace App\Notifications\Admin;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

final class AdminResetPassword extends Notification
{
    public function __construct(
        public string $token
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
            ->subject(__('Reset Password Notification'))
            ->line(__('You are receiving this email because we received a password reset request for your account.'))
            ->action(
                __('Reset Password'),
                route('admin.password.reset', [
                    'token' => $this->token,
                    'email' => $notifiable->getEmailForPasswordReset(), // @phpstan-ignore-line
                ])
            )
            ->line(__('If you did not request a password reset, no further action is required.'));
    }
}
