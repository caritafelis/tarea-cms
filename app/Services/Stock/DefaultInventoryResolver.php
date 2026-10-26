<?php

namespace App\Services\Stock;

use App\Contracts\InventoryResolver;
use App\Contracts\Stockable;
use App\Models\Inventory;
use Illuminate\Database\Eloquent\Collection;

final class DefaultInventoryResolver implements InventoryResolver
{
    /**
     * @return Collection<int, Inventory>
     */
    public function resolve(Stockable $product): Collection
    {
        return Inventory::query()
            ->orderBy('priority')
            ->orderBy('id')
            ->get();
    }
}
