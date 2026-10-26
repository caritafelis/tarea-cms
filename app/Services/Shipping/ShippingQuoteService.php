<?php

namespace App\Services\Shipping;

use App\Models\Cart;
use App\Models\CartLine;
use App\Models\CarrierOption;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

final class ShippingQuoteService
{
    public function productOf(CartLine $line): ?Product
    {
        $model = $line->purchasable;
        $product = $model instanceof ProductVariant ? $model->product : $model;

        return $product instanceof Product ? $product : null;
    }

    /** @return Collection<int, CartLine> */
    public function shippableLines(Cart $cart): Collection
    {
        $cart->loadMissing('lines');
        $cart->lines->loadMorph('purchasable', [ProductVariant::class => ['product']]);

        return $cart->lines->filter(fn (CartLine $l): bool => $this->productOf($l)?->requiresShipping() ?? false)->values();
    }

    public function hasShippableLines(Cart $cart): bool
    {
        return $this->shippableLines($cart)->isNotEmpty();
    }

    /** @return array<int, array{code: string, message: string}> */
    public function issues(Cart $cart): array
    {
        $lines = $this->shippableLines($cart);

        if ($lines->isEmpty()) {
            return [];
        }

        $cart->loadMissing('addresses.country');
        $country = $cart->shippingAddress()?->country?->cca2;

        if (! $country) {
            return [['code' => 'address', 'message' => __('Add a shipping address to see shipping options.')]];
        }

        $issues = [];

        foreach ($lines as $line) {
            $product = $this->productOf($line);
            $origin = $product->shipping_origin_country ?: config('shop.origin_country');

            if (! $product->ship_internationally && $origin && strcasecmp($origin, $country) !== 0) {
                $issues[] = [
                    'code' => 'domestic_only',
                    'message' => __(':name only ships within :country.', ['name' => $product->name, 'country' => strtoupper($origin)]),
                ];
            }
        }

        return $issues;
    }

    /** @return Collection<int, CarrierOption> */
    public function options(Cart $cart): Collection
    {
        $lines = $this->shippableLines($cart);

        if ($lines->isEmpty() || ! $cart->zone_id || $this->issues($cart) !== []) {
            return collect();
        }

        $classes = $lines->map(fn (CartLine $l) => $this->productOf($l)->shipping_class)->filter()->unique()->values();

        return CarrierOption::query()
            ->enabled()
            ->where('zone_id', $cart->zone_id)
            ->whereHas('carrier', fn ($q) => $q->enabled())
            ->with('carrier')
            ->orderBy('price')
            ->get()
            ->filter(function (CarrierOption $option) use ($classes): bool {
                $allowed = collect($option->metadata['shipping_classes'] ?? []);

                return $allowed->isEmpty() || $classes->every(fn ($c) => $allowed->contains($c));
            })
            ->values();
    }

    public function isFree(Cart $cart): bool
    {
        $lines = $this->shippableLines($cart);

        return $lines->isNotEmpty() && $lines->every(fn (CartLine $l): bool => (bool) $this->productOf($l)->shipping_free);
    }

    /** @return array{amount: int, option: ?CarrierOption, issues: array} */
    public function evaluate(Cart $cart): array
    {
        if (! $this->hasShippableLines($cart)) {
            return ['amount' => 0, 'option' => null, 'issues' => []];
        }

        $issues = $this->issues($cart);
        $selected = $this->selectedOptionId($cart);
        $option = $selected ? $this->options($cart)->firstWhere('id', $selected) : null;

        if ($selected && ! $option && ! $issues) {
            $issues[] = ['code' => 'invalid_option', 'message' => __('The selected shipping method is no longer available.')];
        }

        return [
            'amount' => $option && ! $this->isFree($cart) ? (int) $option->price : 0,
            'option' => $option,
            'issues' => $issues,
        ];
    }

    public function selectedOptionId(Cart $cart): ?int
    {
        $id = $this->metadata($cart)['shipping_option_id'] ?? null;

        return $id ? (int) $id : null;
    }

    public function select(Cart $cart, int $optionId): void
    {
        $meta = $this->metadata($cart);
        $meta['shipping_option_id'] = $optionId;

        DB::table('carts')->where('id', $cart->id)->update(['metadata' => json_encode($meta)]);
        $cart->refresh();
    }

    private function metadata(Cart $cart): array
    {
        $m = $cart->metadata;

        return is_string($m) ? (json_decode($m, true) ?: []) : (array) $m;
    }
}