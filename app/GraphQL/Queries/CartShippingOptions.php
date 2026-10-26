<?php

namespace App\GraphQL\Queries;

use App\GraphQL\Support\ResolvesOwnCart;
use App\Models\CarrierOption;
use App\Services\Shipping\ShippingQuoteService;

class CartShippingOptions
{
    use ResolvesOwnCart;

    public function __construct(private readonly ShippingQuoteService $quotes) {}

    public function __invoke($root, array $args): array
    {
        $cart = $this->ownCart($args['cart_id']);
        $free = $this->quotes->isFree($cart);

        return [
            'requires_shipping' => $this->quotes->hasShippableLines($cart),
            'selected' => $this->quotes->selectedOptionId($cart),
            'issues' => $this->quotes->issues($cart),
            'options' => $this->quotes->options($cart)->map(fn (CarrierOption $o): array => [
                'id' => $o->id,
                'name' => $o->name,
                'description' => $o->description,
                'carrier' => $o->carrier?->name,
                'amount' => $free ? 0 : (int) $o->price,
                'free' => $free,
            ])->all(),
        ];
    }
}