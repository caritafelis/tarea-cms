<?php

namespace App\Observers;

use App\Models\Inventory;

class InventoryObserver
{
    public function creating(Inventory $inventory): void
    {
        $this->ensureOnlyOneIsDefault($inventory);
    }

    public function updating(Inventory $inventory): void
    {
        $this->ensureOnlyOneIsDefault($inventory);
    }

    /**
     * Ensures that only one default inventory exists.
     */
    private function ensureOnlyOneIsDefault(Inventory $inventory): void
    {
        if (! $inventory->is_default) {
            return;
        }

        resolve(Inventory::class)::query()
            ->where('id', '!=', $inventory->id)
            ->where('is_default', true)
            ->update(['is_default' => false]);
    }
}
