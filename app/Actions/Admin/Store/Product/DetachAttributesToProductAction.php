<?php

namespace App\Actions\Admin\Store\Product;

use App\Models\AttributeProduct;
use App\Models\Product as ProductContract;
use App\Models\ProductVariant as ProductVariantContract;
use Illuminate\Support\Facades\DB;

final class DetachAttributesToProductAction
{
    public function __invoke(AttributeProduct $attributeProduct, ProductContract $product): void
    {
        DB::transaction(function () use ($attributeProduct, $product): void {
            if ($product->variants()->count()) {
                $product->variants->each(
                    fn (ProductVariantContract $variant) => $variant->values()->detach($attributeProduct->attribute_value_id)
                );
            }

            $attributeProduct->delete();
        });
    }
}
