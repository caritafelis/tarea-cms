<?php

namespace App\Support;

use App\Models\Cart\Cart;
use App\Models\Cart\CartLine;
use App\Models\Price;
use App\Models\Product;
use App\Models\ProductVariant;
use GraphQL\Error\Error;
use Illuminate\Database\Eloquent\Relations\Relation;

/** El precio de una linea SIEMPRE lo fija el servidor, nunca el cliente. */
final class CartPricing
{
    public static function apply(CartLine $line): void
    {
        $class = Relation::getMorphedModel($line->purchasable_type) ?? $line->purchasable_type;

        if (! in_array($class, [Product::class, ProductVariant::class], true)) {
            self::fail('Invalid purchasable.');
        }

        $purchasable = $class::query()->find($line->purchasable_id);

        if (! $purchasable) {
            self::fail('Product not found.');
        }

        $productId = $purchasable instanceof Product ? $purchasable->getKey() : $purchasable->product_id;

        if (! Product::query()->apiVisible()->whereKey($productId)->exists()) {
            self::fail('Product not available.');
        }

        $code = Cart::query()->whereKey($line->cart_id)->value('currency_code');

        $price = Price::query()
            ->where('priceable_type', $purchasable->getMorphClass())
            ->where('priceable_id', $purchasable->getKey())
            ->whereHas('currency', fn ($q) => $q->where('code', $code))
            ->first();

        if (! $price) {
            self::fail('No price for this currency.');
        }

        $line->unit_price_amount = $price->effectiveAmount();
        $line->quantity = max(1, min(999, (int) $line->quantity));
    }

    private static function fail(string $message): never
    {
        if (request()->is('graphql')) {
            throw new Error($message);
        }

        abort(422, $message);
    }
}