<?php

namespace App\Services\Stock;

final readonly class StockAllocation
{
    public function __construct(
        public int $inventoryId,
        public int $quantity,
    ) {}
}
