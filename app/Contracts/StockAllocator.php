<?php

namespace App\Contracts;

use App\Services\Stock\StockAllocation;

interface StockAllocator
{
    /**
     * Determine how to allocate stock for a product across inventories.
     *
     * @return array<int, StockAllocation>
     */
    public function allocate(Stockable $product, int $quantity): array;
}
