<?php

namespace App\Actions\Store;

use App\Models\Collection;
use App\Queries\CollectionProductsQuery;

final class SyncCollectionProductsAction
{
    public function execute(Collection $collection): int
    {
        if ($collection->isManual()) {
            return 0;
        }

        $productIds = (new CollectionProductsQuery)
            ->query($collection)
            ->pluck('id')
            ->toArray();

        $collection->products()->sync($productIds);

        return count($productIds);
    }
}
