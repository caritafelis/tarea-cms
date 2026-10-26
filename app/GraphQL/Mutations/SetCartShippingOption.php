<?php

namespace App\GraphQL\Mutations;

use App\GraphQL\Support\ResolvesOwnCart;
use App\Services\Cart\CartManager;
use App\Services\Shipping\ShippingQuoteService;
use GraphQL\Error\Error;

class SetCartShippingOption
{
    use ResolvesOwnCart;

    public function __construct(
        private readonly ShippingQuoteService $quotes,
        private readonly CartManager $carts,
    ) {}

    public function __invoke($root, array $args): array
    {
        $cart = $this->ownCart($args['cart_id']);
        $id = (int) $args['shipping_option_id'];

        $valid = $this->quotes->options($cart)->pluck('id')->map(fn ($v) => (int) $v)->all();

        if (! in_array($id, $valid, true)) {
            throw new Error('Invalid shipping option.');
        }

        $this->quotes->select($cart, $id);
        $totals = $this->carts->calculate($cart->refresh());

        return [
            'subtotal' => $totals->subtotal,
            'discount' => $totals->discountTotal,
            'shipping' => $totals->shippingTotal,
            'tax' => $totals->taxTotal,
            'total' => $totals->total,
        ];
    }
}