<?php

namespace App\Actions\Admin\Store\Product;

use App\Actions\Admin\Store\InitialQuantityInventory;
use App\Events\Products\ProductCreated;
use App\Models\Product;
use Illuminate\Support\Arr;

final class CreateProductAction
{
    /**
     * @param  array<string, mixed>  $values
     */
    public function __invoke(array $values): Product
    {
        $product = resolve(Product::class)::query()->create(
            Arr::except($values, ['quantity'])
        );

        /** @var ?int $quantity */
        $quantity = data_get($values, 'quantity');

        if ($quantity && $quantity > 0) {
            app()->call(InitialQuantityInventory::class, [
                'quantity' => $quantity,
                'product' => $product,
            ]);
        }

        event(new ProductCreated($product));

        return $product;
    }
}
