<?php

namespace App\Services;

use Illuminate\Support\Facades\Process;
use Resend\Laravel\Facades\Resend;
use Illuminate\Support\Facades\Log;

class EmailService
{
    /**
     * Send a React-rendered email using Resend.
     */
    public function sendReactEmail(string $to, string $subject, string $componentName, array $props = []): bool
    {
        try {
            $nodeScript = base_path('scripts/render-email.ts');
            $propsJson = json_encode($props);

            // Execute the tsx script to render the HTML
            $process = Process::run(['npx', 'tsx', $nodeScript, $componentName, $propsJson]);

            if ($process->failed()) {
                Log::error("Failed to render React Email template: " . $process->errorOutput());
                return false;
            }

            $html = trim($process->output());

            $from = env('MAIL_FROM_ADDRESS', 'no-reply@cms.test');
            $fromName = env('MAIL_FROM_NAME', 'CMS');

            Resend::emails()->send([
                'from' => "{$fromName} <{$from}>",
                'to' => $to,
                'subject' => $subject,
                'html' => $html,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error("Error sending Resend email: " . $e->getMessage());
            return false;
        }
    }
}
