<?php

namespace App\Support;

use App\Models\Webhook;

final class WebhookDocs
{
    private const RESOURCES = [
        'post' => ['title' => 'Hello world', 'slug' => 'hello-world', 'status' => 'published'],
        'page' => ['title' => 'About', 'slug' => 'about', 'status' => 'published'],
        'product' => ['name' => 'T-shirt', 'slug' => 't-shirt', 'status' => 'active'],
        'entry' => ['title' => 'StuvGraph', 'slug' => 'stuvgraph', 'status' => 'published'],
        'media' => ['name' => 'logo', 'file_name' => 'logo.svg', 'mime_type' => 'image/svg+xml', 'size' => 2048],
        'order' => ['status' => 'pending', 'total' => 4900, 'currency' => 'usd', 'email' => 'buyer@example.com'],
        'user' => ['name' => 'Ada Lovelace', 'email' => 'ada@example.com'],
    ];

    public static function catalog(): array
    {
        $events = [];

        foreach (Webhook::EVENTS as $event) {
            [$type, $action] = explode('.', $event);
            $verb = ['created' => 'created', 'updated' => 'updated', 'deleted' => 'deleted', 'uploaded' => 'uploaded'][$action];

            $events[$event] = [
                'description' => "Sent when a {$type} is {$verb}.",
                'example' => [
                    'id' => '3f5c0c1e-8c1b-4a5e-9d6e-0b7f3a1d2c44',
                    'event' => $event,
                    'environment' => 'live',
                    'payload' => ['id' => 12, 'type' => $type, 'attributes' => self::RESOURCES[$type]],
                    'sent_at' => '2026-10-23T12:00:00+00:00',
                ],
            ];
        }

        return [
            'version' => '1',
            'delivery' => [
                'method' => 'POST',
                'content_type' => 'application/json',
                'timeout_seconds' => 10,
                'success' => 'Any 2xx response.',
                'retries' => 'None automatically. Failed deliveries are kept in the delivery log.',
            ],
            'headers' => [
                'X-CMS-Signature' => 'Hex HMAC-SHA256 of the raw request body, using the webhook secret.',
                'X-CMS-Event' => 'Event name, e.g. post.created.',
                'X-CMS-Delivery' => 'Unique delivery id (same as "id" in the body). Use it to deduplicate.',
                'X-CMS-Environment' => 'live or test.',
            ],
            'verification' => [
                'php' => '$valid = hash_equals(hash_hmac("sha256", $rawBody, $secret), $_SERVER["HTTP_X_CMS_SIGNATURE"]);',
                'node' => 'const valid = crypto.timingSafeEqual(Buffer.from(crypto.createHmac("sha256", secret).update(rawBody).digest("hex")), Buffer.from(req.headers["x-cms-signature"]));',
            ],
            'events' => $events,
        ];
    }
}