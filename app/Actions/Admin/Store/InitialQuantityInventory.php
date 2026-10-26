<?php

namespace App\Actions\Admin\Store;

use App\Models\Inventory;
use App\Models\Product;
use App\Models\ProductVariant;

final class InitialQuantityInventory
{
    public function __invoke(int $quantity, Product|ProductVariant $product): void
    {
        /** @var ?Inventory $inventory */
        $inventory = resolve(Inventory::class)::query()->scopes('default')->first();

        if ($inventory instanceof Inventory) {
            $product->mutateStock(
                inventoryId: $inventory->id,
                quantity: $quantity,
                oldQuantity: $quantity,
                event: __('shopper::pages/products.inventory.initial'),
            );
        }
    }
}
