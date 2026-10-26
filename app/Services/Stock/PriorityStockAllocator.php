<?php

namespace App\Services\Stock;

use App\Contracts\InventoryResolver;
use App\Contracts\Stockable;
use App\Contracts\StockAllocator;

final readonly class PriorityStockAllocator implements StockAllocator
{
    public function __construct(
        private InventoryResolver $resolver,
    ) {}

    /**
     * @return array<int, StockAllocation>
     */
    public function allocate(Stockable $product, int $quantity): array
    {
        $inventories = $this->resolver->resolve($product);

        if ($inventories->isEmpty()) {
            return [];
        }

        // 1. Try single location — first inventory with enough stock
        foreach ($inventories as $inventory) {
            $available = $product->stockInventory($inventory->id);

            if ($available >= $quantity) {
                return [new StockAllocation($inventory->id, $quantity)];
            }
        }

        // 2. Split across multiple locations
        $remaining = $quantity;
        $allocations = [];

        foreach ($inventories as $inventory) {
            if ($remaining <= 0) {
                break;
            }

            $available = $product->stockInventory($inventory->id);

            if ($available <= 0) {
                continue;
            }

            $take = min($available, $remaining);
            $allocations[] = new StockAllocation($inventory->id, $take);
            $remaining -= $take;
        }

        return $allocations;
    }
}
