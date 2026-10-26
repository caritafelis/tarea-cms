<?php

namespace App\Services\Cart;

use App\Contracts\Priceable;
use App\Contracts\Stockable;
use App\Enums\AddressType;
use App\Models\Cart\Cart;
use App\Models\Cart\CartLine;
use App\Models\Discount;
use App\Services\Cart\Events\CouponApplied;
use App\Services\Cart\Events\CouponRemoved;
use App\Services\Cart\Exceptions\CartCompletedException;
use App\Services\Cart\Exceptions\InsufficientStockException;
use App\Services\Cart\Exceptions\InvalidDiscountException;
use App\Services\Cart\Pipelines\CartPipelineContext;
use App\Services\Cart\Pipelines\CartPipelineRunner;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use Throwable;

final readonly class CartManager
{
    public function __construct(
        private CartPipelineRunner $pipelineRunner,
    ) {}

    /**
     * @param  array<string, mixed>|null  $metadata
     *
     * @throws Throwable
     */
    public function add(Cart $cart, Priceable&Model $purchasable, int $quantity = 1, ?array $metadata = null): CartLine
    {
        $this->guardQuantity($quantity);
        $this->guardCompleted($cart);

        return DB::transaction(function () use ($cart, $purchasable, $quantity, $metadata): CartLine {
            $existing = $cart->lines()
                ->where('purchasable_type', $purchasable->getMorphClass())
                ->where('purchasable_id', $purchasable->getKey())
                ->lockForUpdate()
                ->first();

            $requestedQuantity = $existing ? $existing->quantity + $quantity : $quantity;
            $this->guardPurchaseRules($purchasable, $requestedQuantity);
            $this->guardStock($purchasable, $requestedQuantity);

            if ($existing) {
                $existing->update([
                    'quantity' => $requestedQuantity,
                ]);

                return $existing->refresh();
            }

            $price = $purchasable->getPrice($cart->currency_code);

            return $cart->lines()->create([
                'purchasable_type' => $purchasable->getMorphClass(),
                'purchasable_id' => $purchasable->getKey(),
                'quantity' => $quantity,
                'unit_price_amount' => $price ? $price->effectiveAmount() : 0,
                'metadata' => $metadata,
            ]);
        });
    }

    /**
     * @param  array{quantity?: int, metadata?: array<string, mixed>|null}  $data
     *
     * @throws Throwable
     */
    public function update(Cart $cart, int $lineId, array $data): CartLine
    {
        $this->guardCompleted($cart);

        return DB::transaction(function () use ($cart, $lineId, $data): CartLine {
            /** @var CartLine $line */
            $line = $cart->lines()->lockForUpdate()->findOrFail($lineId);

            if (isset($data['quantity'])) {
                $this->guardQuantity($data['quantity']);
                $this->guardPurchaseRules($purchasable, $requestedQuantity);
                $this->guardStock($line->purchasable, $data['quantity']);
            }

            $line->update(Arr::only($data, ['quantity', 'metadata']));

            return $line->refresh();
        });
    }

    public function remove(Cart $cart, int $lineId): void
    {
        $this->guardCompleted($cart);

        $cart->lines()->findOrFail($lineId)->delete();
    }

    public function clear(Cart $cart): void
    {
        $this->guardCompleted($cart);

        $cart->lines()->delete();
    }

    public function calculate(Cart $cart): CartPipelineContext
    {
        return $this->pipelineRunner->run($cart);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function addAddress(Cart $cart, AddressType $type, array $data): void
    {
        $cart->addresses()->updateOrCreate(
            ['type' => $type],
            array_merge($data, ['type' => $type]),
        );
    }

    public function applyCoupon(Cart $cart, string $code): void
    {
        $this->guardCompleted($cart);

        $discount = Discount::query()->where('code', $code)->first();

        if (! $discount instanceof Discount) {
            throw new InvalidDiscountException(__('shopper-cart::messages.discount.not_found'));
        }

        $cart->update(['coupon_code' => $code]);

        CouponApplied::dispatch($cart, $code);
    }

    public function removeCoupon(Cart $cart): void
    {
        $this->guardCompleted($cart);

        $cart->update(['coupon_code' => null]);

        foreach ($cart->lines as $line) {
            $line->adjustments()->delete();
        }

        CouponRemoved::dispatch($cart);
    }

    private function productOf(Model $purchasable): ?Product
    {
        $product = $purchasable instanceof ProductVariant ? $purchasable->product : $purchasable;

        return $product instanceof Product ? $product : null;
    }

    private function guardPurchaseRules(Model $purchasable, int $quantity): void
    {
        $product = $this->productOf($purchasable);

        if (! $product) {
            return;
        }

        $name = $product->name;

        if (! $product->manage_stock && $product->stock_status === 'outofstock') {
            throw new InvalidArgumentException(__(':name is out of stock.', ['name' => $name]));
        }
        if ($product->sold_individually && $quantity > 1) {
            throw new InvalidArgumentException(__(':name can only be purchased one at a time.', ['name' => $name]));
        }
        if ($product->min_qty > 0 && $quantity < $product->min_qty) {
            throw new InvalidArgumentException(__('The minimum quantity for :name is :qty.', ['name' => $name, 'qty' => $product->min_qty]));
        }
        if ($product->max_qty > 0 && $quantity > $product->max_qty) {
            throw new InvalidArgumentException(__('The maximum quantity for :name is :qty.', ['name' => $name, 'qty' => $product->max_qty]));
        }
    }

    private function guardCompleted(Cart $cart): void
    {
        if ($cart->isCompleted()) {
            throw new CartCompletedException;
        }
    }

    private function guardQuantity(int $quantity): void
    {
        if ($quantity < 1) {
            throw new InvalidArgumentException(__('Quantity must be at least 1.'));
        }
    }

    private function guardStock(Model $purchasable, int $quantity): void
    {
        if (! $purchasable instanceof Stockable || ! $purchasable->tracksInventory()) {
            return;
        }

        // "Track quantity" apagado: manda stock_status, no el conteo.
        if ($this->productOf($purchasable)?->manage_stock === false) {
            return;
        }

        if ($purchasable->getAttribute('allow_backorder') || $purchasable->inStock($quantity)) {
            return;
        }

        throw new InsufficientStockException(purchasable: $purchasable, available: $purchasable->stock, requested: $quantity);
    }
}
