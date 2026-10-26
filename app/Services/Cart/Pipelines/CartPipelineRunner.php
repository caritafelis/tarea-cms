<?php

namespace App\Services\Cart\Pipelines;

use App\Models\Cart\Cart;
use Illuminate\Pipeline\Pipeline;

final class CartPipelineRunner
{
    public function run(Cart $cart): CartPipelineContext
    {
        $cart->loadMissing([
            'lines.purchasable',
            'lines.adjustments',
            'lines.taxLines',
            'addresses.country',
        ]);

        $context = new CartPipelineContext($cart);

        app(Pipeline::class)
            ->send($context)
            ->through(config('cart.pipelines.cart'))
            ->thenReturn();

        return $context;
    }
}
