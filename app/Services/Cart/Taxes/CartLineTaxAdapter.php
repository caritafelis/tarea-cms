<?php

namespace App\Services\Cart\Taxes;

use App\Contracts\TaxableItem;
use App\Models\Cart\CartLine;
use App\Models\Product;
use App\Models\ProductVariant;

final readonly class CartLineTaxAdapter implements TaxableItem
{
    public function __construct(
        private CartLine $line,
        private int $taxableTotal,
    ) {}

    public function getTaxableTotal(): int
    {
        return $this->taxableTotal;
    }

    public function getProductType(): ?string
    {
        return $this->resolveProduct()?->type?->value;
    }

    public function getProductId(): ?int
    {
        $product = $this->resolveProduct();

        return $product?->id;
    }

    /** @return array<int, int> */
    public function getCategoryIds(): array
    {
        $product = $this->resolveProduct();

        if (! $product) {
            return [];
        }

        return $product->categories()->pluck('id')->all();
    }

    private function resolveProduct(): ?Product
    {
        $model = $this->line->purchasable;

        if ($model instanceof ProductVariant) {
            return $model->product;
        }

        if ($model instanceof Product) {
            return $model;
        }

        return null;
    }
}
