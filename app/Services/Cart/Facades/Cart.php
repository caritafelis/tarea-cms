<?php

namespace App\Services\Cart\Facades;

use App\Services\Cart\CartSessionManager;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Facades\Facade;

/**
 * @method static \App\Models\Cart\Cart current()
 * @method static \App\Models\Cart\Cart create()
 * @method static void use(\App\Models\Cart\Cart $cart)
 * @method static void forget()
 * @method static void associate(Authenticatable $user)
 *
 * @see CartSessionManager
 */
final class Cart extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return CartSessionManager::class;
    }
}
