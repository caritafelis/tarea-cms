<?php

namespace App\Providers;

use App\Models\CptEntry;
use App\Models\Media;
use App\Models\Order;
use App\Models\Page;
use App\Models\Post;
use App\Models\Product;
use App\Models\User;
use App\Services\Settings\WebhookService;
use Illuminate\Support\Arr;
use Illuminate\Support\ServiceProvider;

class WebhookEventsServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        foreach (['post' => Post::class, 'page' => Page::class, 'product' => Product::class, 'entry' => CptEntry::class] as $type => $class) {
            foreach (['created', 'updated', 'deleted'] as $action) {
                $class::$action(fn ($m) => $this->fire("{$type}.{$action}", [
                    'id' => $m->getKey(), 'type' => $type, 'attributes' => $m->attributesToArray(),
                ]));
            }
        }

        Media::created(fn ($m) => $this->fire('media.uploaded', [
            'id' => $m->id, 'type' => 'media',
            'attributes' => Arr::only($m->attributesToArray(), ['name', 'file_name', 'mime_type', 'size']),
        ]));

        Order::created(fn ($m) => $this->fire('order.created', [
            'id' => $m->id, 'type' => 'order',
            'attributes' => Arr::only($m->attributesToArray(), ['status', 'total', 'currency', 'email']),
        ]));

        User::created(fn ($m) => $this->fire('user.created', [
            'id' => $m->id, 'type' => 'user', 'attributes' => Arr::only($m->attributesToArray(), ['name', 'email']),
        ]));
    }

    private function fire(string $event, array $payload): void
    {
        dispatch(fn () => app(WebhookService::class)->dispatch($event, $payload))->afterResponse();
    }
}