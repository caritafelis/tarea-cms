<?php

namespace App\Listeners\Orders;

use App\Events\Orders\OrderCancelled;
use App\Events\Orders\OrderPaid;
use App\Events\Orders\OrderShipmentDelivered;
use App\Events\Orders\OrderShipped;
use App\Models\Order;
use App\Notifications\BrandedNotification;
use Illuminate\Support\Facades\Notification;

class SendOrderEmails
{
    public function handleOrderPaid(OrderPaid $e): void
    {
        $this->send($e->order, 'order-confirmation', "Order #{$this->number($e->order)} confirmed", [
            'items' => $e->order->items->map(fn ($i) => [
                'name' => $i->name,
                'qty' => $i->quantity,
                'total' => $this->money($i->total ?? 0),
            ])->all(),
            'subtotal' => $this->money($e->order->subtotal ?? 0),
            'shipping' => $this->money($e->order->shipping_total ?? 0),
            'tax' => $this->money($e->order->tax_total ?? 0),
            'total' => $this->money($e->order->total),
            'address' => (string) ($e->order->shippingAddress?->address_line_1 ?? ''),
        ]);
    }

    public function handleOrderShipped(OrderShipped $e): void
    {
        $shipment = $e->order->shipments->last();

        $this->send($e->order, 'order-shipped', "Order #{$this->number($e->order)} is on its way", [
            'carrier' => (string) ($shipment?->carrier_name ?? '-'),
            'tracking' => (string) ($shipment?->tracking_number ?? '-'),
        ]);
    }

    public function handleOrderShipmentDelivered(OrderShipmentDelivered $e): void
    {
        $order = $e->order ?? $e->shipment->order;
        $this->send($order, 'order-delivered', "Order #{$this->number($order)} delivered");
    }

    public function handleOrderCancelled(OrderCancelled $e): void
    {
        $this->send($e->order, 'order-cancelled', "Order #{$this->number($e->order)} canceled", [
            'total' => $this->money($e->order->total),
        ]);
    }

    private function send(Order $order, string $template, string $subject, array $extra = []): void
    {
        $to = $order->customer ?? Notification::route('mail', $order->email);

        if (! $to) {
            return;
        }

        Notification::send($to, new BrandedNotification($template, $subject, $extra + [
            'name' => $order->customer?->name ?? 'there',
            'orderNumber' => $this->number($order),
            'url' => url('/'),
            'appName' => config('app.name'),
        ]));
    }

    private function number(Order $o): string
    {
        return (string) ($o->number ?? $o->id);
    }

    private function money($v): string
    {
        return '$'.number_format((float) $v, 2);
    }
}