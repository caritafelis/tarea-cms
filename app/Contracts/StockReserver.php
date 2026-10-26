<?php

namespace App\Contracts;

use Illuminate\Database\Eloquent\Model;

interface StockReserver
{
    /**
     * @param  Model&Stockable  $product
     */
    public function reserve(Stockable $product, int $quantity, ?Model $reference = null, ?int $userId = null): int;
}
