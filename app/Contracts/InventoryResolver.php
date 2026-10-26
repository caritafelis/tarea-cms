<?php

namespace App\Contracts;

use App\Models\Inventory;
use Illuminate\Database\Eloquent\Collection;

/**
 * @phpstan-type InventoryCollection Collection<int, Inventory>
 */
interface InventoryResolver
{
    /**
     * Resolve the inventories available for a given stockable product.
     *
     * @return Collection<int, Inventory>
     */
    public function resolve(Stockable $product): Collection;
}
