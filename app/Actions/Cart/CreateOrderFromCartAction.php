<?php

namespace App\Actions\Cart;

use App\Actions\Store\CreateOrderTaxLinesAction;
use App\Contracts\Stockable;
use App\Contracts\StockReserver;
use App\Models\Cart\Cart;
use App\Models\Cart\CartAddress;
use App\Models\Discount;
use App\Models\Order;
use App\Models\Order as OrderContract;
use App\Models\OrderAddress;
use App\Models\ProductVariant;
use App\Models\ProductVariant as ProductVariantModel;
use App\Services\Cart\CartManager;
use App\Services\Cart\Events\CartCompleted;
use App\Services\Cart\Exceptions\CartCompletedException;
use App\Services\Cart\Exceptions\DiscountLimitReachedException;
use App\Services\Cart\Exceptions\InsufficientStockException;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

final readonly class CreateOrderFromCartAction
{
    public function __construct(
        private CartManager $cartManager,
        private CreateOrderTaxLinesAction $createOrderTaxLines,
        private StockReserver $stockReserver,
    ) {}

    public function execute(Cart $cart): Order
    {
        return DB::transaction(function () use ($cart): Order {
            /** @var Cart $cart */
            $cart = Cart::query()->lockForUpdate()->findOrFail($cart->id);

            if ($cart->isCompleted()) {
                throw new CartCompletedException;
            }

            $discount = $this->reserveDiscount($cart);

            $context = $this->cartManager->calculate($cart);

            if ($context->shippingIssues !== []) {
                throw new \InvalidArgumentException($context->shippingIssues[0]['message']);
            }

            if (resolve(\App\Services\Shipping\ShippingQuoteService::class)->hasShippableLines($cart) && ! $context->shippingOption) {
                throw new \InvalidArgumentException(__('Select a shipping method before checking out.'));
            }

            $shippingAddress = $this->createOrderAddress($cart->shippingAddress(), $cart->customer_id);
            $billingAddress = $this->createOrderAddress($cart->billingAddress(), $cart->customer_id);

            $order = resolve(OrderContract::class)::query()->create([
                'number' => generate_number(),
                'price_amount' => $context->total,
                'tax_amount' => $context->taxTotal,
                'currency_code' => $cart->currency_code,
                'customer_id' => $cart->customer_id,
                'channel_id' => $cart->channel_id,
                'zone_id' => $cart->zone_id,
                'shipping_address_id' => $shippingAddress?->id,
                'billing_address_id' => $billingAddress?->id,
                'discount_id' => $discount?->id,
                'discount_code' => $discount?->code,
                'discount_type' => $discount?->type->value,
                'discount_value_at_apply' => $discount?->value,
                'discount_currency_code' => $discount !== null ? $cart->currency_code : null,
                'shipping_option_id' => $context->shippingOption?->id,
                'shipping_amount' => $context->shippingTotal,
            ]);

            $cart->lines->loadMorph('purchasable', [
                ProductVariantModel::class => ['product'],
            ]);

            foreach ($cart->lines as $line) {
                $discountAmount = $line->adjustments->sum('amount');
                $purchasable = $line->purchasable;

                $order->items()->create([
                    'name' => $this->resolveItemName($purchasable),
                    'sku' => $purchasable->sku ?? '',
                    'quantity' => $line->quantity,
                    'unit_price_amount' => $line->unit_price_amount,
                    'discount_amount' => $discountAmount,
                    'product_type' => $line->purchasable_type,
                    'product_id' => $line->purchasable_id,
                ]);

                if ($purchasable instanceof Stockable && $purchasable->tracksInventory()) {
                    $reserved = $this->stockReserver->reserve(
                        $purchasable,
                        $line->quantity,
                        $order,
                        $cart->customer_id,
                    );

                    if ($reserved < $line->quantity) {
                        throw new InsufficientStockException($purchasable, $reserved, $line->quantity);
                    }
                }
            }

            $this->createOrderTaxLines->execute($order);

            $order->refresh();

            $cart->update(['completed_at' => now()]);

            CartCompleted::dispatch($cart, $order);

            return $order;
        });
    }

    private function reserveDiscount(Cart $cart): ?Discount
    {
        if (! $cart->coupon_code) {
            return null;
        }

        $discount = Discount::query()
            ->where('code', $cart->coupon_code)
            ->lockForUpdate()
            ->first();

        if ($discount === null) {
            return null;
        }

        if ($discount->usage_limit_per_user) {
            if ($cart->customer_id === null) {
                throw DiscountLimitReachedException::perUser($discount->code);
            }

            $alreadyRedeemed = resolve(OrderContract::class)::query()
                ->where('discount_id', $discount->id)
                ->where('customer_id', $cart->customer_id)
                ->exists();

            if ($alreadyRedeemed) {
                throw DiscountLimitReachedException::perUser($discount->code);
            }
        }

        $affected = Discount::query()
            ->whereKey($discount->id)
            ->where(function ($query): void {
                $query->whereNull('usage_limit')
                    ->orWhereColumn('total_use', '<', 'usage_limit');
            })
            ->increment('total_use');

        if ($affected === 0) {
            throw DiscountLimitReachedException::global($discount->code);
        }

        $discount->refresh();

        return $discount;
    }

    private function resolveItemName(Model $purchasable): string
    {
        if ($purchasable instanceof ProductVariant) {
            $productName = $purchasable->product?->name;

            return $productName
                ? $productName.' / '.$purchasable->name
                : $purchasable->name ?? '';
        }

        return $purchasable->name ?? '';
    }

    private function createOrderAddress(?CartAddress $cartAddress, ?int $customerId): ?OrderAddress
    {
        if (! $cartAddress) {
            return null;
        }

        return OrderAddress::query()->create([
            'customer_id' => $customerId,
            'first_name' => $cartAddress->first_name,
            'last_name' => $cartAddress->last_name,
            'company' => $cartAddress->company,
            'street_address' => $cartAddress->address_1,
            'street_address_plus' => $cartAddress->address_2,
            'city' => $cartAddress->city,
            'state' => $cartAddress->state,
            'postal_code' => $cartAddress->postal_code,
            'phone' => $cartAddress->phone,
            'country_name' => $cartAddress->country?->name,
        ]);
    }
}
