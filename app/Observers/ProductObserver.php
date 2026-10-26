<?php

namespace App\Observers;

use App\Jobs\SyncProductWithCollectionsJob;
use App\Models\Product;

class ProductObserver
{
    public function saved(Product $product): void
    {
        SyncProductWithCollectionsJob::dispatch($product)->afterCommit();
    }

    public function deleting(Product $product): void
    {
        // $product debe implementar Spatie\MediaLibrary\HasMedia (InteractsWithMedia).
        // clearMediaCollection() borra los registros Y los archivos físicos del disco;
        // media()->delete() dejaba archivos huérfanos en el disco.
        $product->clearMediaCollection();
        $product->prices()->delete();
        $product->clearStock();
    }
}
