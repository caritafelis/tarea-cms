<?php

namespace App\GraphQL\Support;

use App\Models\Cart\Cart;
use GraphQL\Error\Error;

trait ResolvesOwnCart
{
    protected function ownCart(mixed $id): Cart
    {
        $user = auth()->user();
        $cart = Cart::query()->find($id);

        // Mismo mensaje si no existe o no es suyo (evita enumeracion de IDs)
        if (! $cart || ! $user
            || ((string) $cart->customer_id !== (string) $user->getKey() && ! $user->can('update_order'))) {
            throw new Error('Cart not found or not yours.');
        }

        return $cart;
    }
}