<?php

namespace App\Listeners\Orders;

use App\Actions\Store\SyncOrderShippingStatusAction;
use App\Events\Orders\OrderShipmentCreated;
use Illuminate\Contracts\Queue\ShouldQueue;

final class SyncOrderShippingStatusListener implements ShouldQueue
{
    public function handle(OrderShipmentCreated $event): void
    {
        (new SyncOrderShippingStatusAction)->execute($event->order);
    }
}
