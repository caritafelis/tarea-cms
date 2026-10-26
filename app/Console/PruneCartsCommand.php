<?php

namespace App\Console;

use App\Models\Cart\Cart;
use Illuminate\Console\Command;

final class PruneCartsCommand extends Command
{
    protected $signature = 'shopper:prune-carts
                            {--days= : Number of days after which abandoned carts are pruned}';

    protected $description = 'Delete abandoned carts older than the configured TTL';

    public function handle(): int
    {
        $days = (int) ($this->option('days') ?? config('cart.prune_after_days', 30));

        $count = Cart::query()
            ->whereNull('completed_at')
            ->where('updated_at', '<', now()->subDays($days))
            ->delete();

        $this->components->info("{$count} abandoned cart(s) pruned.");

        return self::SUCCESS;
    }
}
