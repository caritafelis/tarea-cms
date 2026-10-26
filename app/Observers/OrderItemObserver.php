<?php

namespace App\Observers;

use App\Events\Orders\OrderItemCreated;
use App\Models\OrderItem;

class OrderItemObserver
{
    public function created(OrderItem $orderItem): void
    {
        event(new OrderItemCreated($orderItem));
    }
}
