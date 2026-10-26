<?php

namespace App\Contracts;

use App\Models\InventoryHistory;
use Illuminate\Database\Eloquent\Model;

/**
 * Marker contract for models that carry stock via the HasStock trait
 * (Product and ProductVariant). Replaces the old package's swappable
 * "Models\Contracts" interface layer, which no longer exists in this
 * app-based structure.
 */
interface Stockable
{
    public function getKey();

    public function getAttribute($key);

    public function stockInventory(int $inventoryId, ?string $date = null): int;

    public function decreaseStock(
        int $inventoryId,
        int $quantity = 1,
        int $oldQuantity = 0,
        ?string $event = null,
        ?string $description = null,
        ?int $userId = null,
        ?Model $reference = null,
    ): InventoryHistory;
}
