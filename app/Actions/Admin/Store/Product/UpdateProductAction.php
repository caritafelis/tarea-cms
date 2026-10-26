<?php

namespace App\Actions\Admin\Store\Product;

use App\Events\Products\ProductUpdated;
use App\Models\Product;
use Illuminate\Database\Eloquent\Model;

final class UpdateProductAction
{
    /**
     * @param  array<string, mixed>  $values
     * @param  Model&Product  $product
     */
    public function __invoke(array $values, Product $product): Product
    {
        $product->update($values);
        $product->refresh();

        event(new ProductUpdated($product));

        return $product;
    }
}
