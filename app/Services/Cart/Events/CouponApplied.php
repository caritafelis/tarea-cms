<?php

namespace App\Services\Cart\Events;

use App\Models\Cart\Cart;
use Illuminate\Foundation\Events\Dispatchable;

final readonly class CouponApplied
{
    use Dispatchable;

    public function __construct(
        public Cart $cart,
        public string $code,
    ) {}
}
