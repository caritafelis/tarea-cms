<?php

namespace App\Services\Settings;

use Illuminate\Support\Facades\Mail;

class MailTestService
{
    public function send(string $toEmail): array
    {
        try {
            Mail::raw('This is a test email from your CMS Settings page.', function ($message) use ($toEmail) {
                $message->to($toEmail)->subject('CMS — Test Email');
            });

            return ['success' => true, 'message' => "Test email sent to {$toEmail}."];
        } catch (\Throwable $e) {
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }
}
