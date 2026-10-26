<?php

namespace App\Observers;

use App\Models\ProductVariant;

class ProductVariantObserver
{
    public function deleting(ProductVariant $variant): void
    {
        // $variant debe implementar Spatie\MediaLibrary\HasMedia (InteractsWithMedia).
        $variant->clearMediaCollection();
        $variant->prices()->delete();
        $variant->clearStock();
    }
}
