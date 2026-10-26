<?php

namespace App\Services\Settings;

use App\Models\Webhook;
use App\Models\WebhookLog;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class WebhookService
{
    public function dispatch(string $event, array $payload = [], ?string $environment = null): void
    {
        $environment ??= request()->attributes->get('api_environment');

        Webhook::query()
            ->where('is_active', true)
            ->when($environment, fn ($q) => $q->where('environment', $environment))
            ->whereJsonContains('events', $event)
            ->get()
            ->each(fn (Webhook $webhook) => $this->send($webhook, $event, $payload));
    }

    public function test(Webhook $webhook): WebhookLog
    {
        return $this->send($webhook, 'webhook.test', ['message' => 'This is a test event from your CMS.']);
    }

    protected function send(Webhook $webhook, string $event, array $payload): WebhookLog
    {
        $delivery = (string) Str::uuid();
        $body = [
            'id' => $delivery,
            'event' => $event,
            'environment' => $webhook->environment,
            'payload' => $payload,
            'sent_at' => now()->toIso8601String(),
        ];
        $json = json_encode($body, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $signature = hash_hmac('sha256', $json, $webhook->secret ?? '');

        try {
            $response = Http::withHeaders([
                'X-CMS-Signature' => $signature,
                'X-CMS-Environment' => $webhook->environment,
                'X-CMS-Event' => $event,
                'X-CMS-Delivery' => $delivery,
            ])->timeout(10)->withBody($json, 'application/json')->post($webhook->url);

            return $webhook->logs()->create([
                'event' => $event, 'response_code' => $response->status(), 'payload' => $json,
                'response_body' => Str::limit($response->body(), 2000), 'successful' => $response->successful(),
            ]);
        } catch (\Throwable $e) {
            return $webhook->logs()->create([
                'event' => $event, 'response_code' => null, 'payload' => $json,
                'response_body' => $e->getMessage(), 'successful' => false,
            ]);
        }
    }
}
