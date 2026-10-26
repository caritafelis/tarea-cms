<?php

namespace App\Services\Cart\Events;

use App\Models\Cart\Cart;
use App\Models\Order;
use Illuminate\Foundation\Events\Dispatchable;

final readonly class CartCompleted
{
    use Dispatchable;

    public function __construct(
        public Cart $cart,
        public Order $order,
    ) {}
}
