<?php

namespace App\Listeners\Orders;

use App\Events\Orders\OrderPaid;
use App\Models\DownloadGrant;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Support\Str;

final class GrantOrderDownloads
{
    public function handle(OrderPaid $event): void
    {
        $order = $event->order->loadMissing('items.product');

        foreach ($order->items as $item) {
            $model = $item->product;
            $product = $model instanceof ProductVariant ? $model->product : $model;

            if (! $product instanceof Product || $product->type?->value !== 'virtual') {
                continue;
            }

            foreach ($product->getMedia('files') as $media) {
                DownloadGrant::firstOrCreate(
                    ['order_item_id' => $item->id, 'media_id' => $media->id],
                    [
                        'order_id' => $order->id,
                        'token' => Str::random(48),
                        'download_limit' => $product->download_limit ?: null,
                        'expires_at' => $product->download_expiry_days ? now()->addDays($product->download_expiry_days) : null,
                    ],
                );
            }
        }
    }
}