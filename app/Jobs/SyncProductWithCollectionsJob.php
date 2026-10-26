<?php

namespace App\Jobs;

use App\Models\Collection;
use App\Models\Product;
use App\Queries\CollectionProductsQuery;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

final class SyncProductWithCollectionsJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(
        public Product $product
    ) {}

    public function handle(CollectionProductsQuery $query): void
    {
        resolve(Collection::class)::query()
            ->automatic()
            ->with('rules')
            ->each(function (Collection $collection) use ($query): void {
                if ($query->matches($collection, $this->product)) {
                    $collection->products()->syncWithoutDetaching([$this->product->id]);
                } else {
                    $collection->products()->detach($this->product->id);
                }
            });
    }
}
