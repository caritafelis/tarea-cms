<?php

namespace App\Observers;

use App\Events\Orders\OrderCreated;
use App\Events\Orders\OrderDeleted;
use App\Models\Order;

class OrderObserver
{
    public function created(Order $order): void
    {
        event(new OrderCreated($order));
    }

    public function deleting(Order $order): void
    {
        event(new OrderDeleted($order));
    }
}
