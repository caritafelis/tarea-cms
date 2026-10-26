<?php

namespace App\Listeners\Orders;

use App\Contracts\Stockable;
use App\Events\Orders\OrderCancelled;
use Illuminate\Contracts\Queue\ShouldQueue;

final class RestoreOrderStockListener implements ShouldQueue
{
    public function handle(OrderCancelled $event): void
    {
        $order = $event->order->load('items.product');

        foreach ($order->items as $item) {
            if (! $item->product instanceof Stockable) {
                continue;
            }

            $reservations = $item->product->inventoryHistories()
                ->where('reference_type', $order->getMorphClass())
                ->where('reference_id', $order->getKey())
                ->where('quantity', '<', 0)
                ->get();

            foreach ($reservations as $reservation) {
                $item->product->mutateStock(
                    inventoryId: $reservation->inventory_id,
                    quantity: abs($reservation->quantity),
                    oldQuantity: $item->product->stockInventory($reservation->inventory_id),
                    event: __('shopper-core::status.stock.cancelled'),
                    userId: $order->customer_id,
                    reference: $order,
                );
            }
        }
    }
}
