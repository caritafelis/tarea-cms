<?php

namespace App\Actions\Admin\Store\Product;

use App\Models\Product;
use Illuminate\Support\Arr;

final class AttachedAttributesToProductAction
{
    /**
     * @param  array<int, mixed>  $attributes
     * @param  array<array-key, mixed>  $customValues
     */
    public function __invoke(Product $product, array $attributes, array $customValues = []): void
    {
        foreach ($attributes as $attributeId => $values) {
            Arr::map(
                array: Arr::wrap($values),
                callback: fn ($value) => $product->options()
                    ->attach($attributeId, ['attribute_value_id' => (int) $value])
            );
        }

        if (count($customValues) > 0) {
            foreach ($customValues as $attributeId => $value) {
                $product->options()->attach([
                    $attributeId => ['attribute_custom_value' => $value],
                ]);
            }
        }
    }
}
