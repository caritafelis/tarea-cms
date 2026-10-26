<?php

namespace App\Jobs;

use App\Actions\Store\SyncCollectionProductsAction;
use App\Models\Collection;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

final class SyncCollectionProductsJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(
        public Collection $collection
    ) {}

    public function handle(SyncCollectionProductsAction $action): void
    {
        $action->execute($this->collection);
    }
}
