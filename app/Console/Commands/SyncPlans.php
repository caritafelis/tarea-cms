<?php

namespace App\Console\Commands;

use App\Models\Plan;
use App\Services\Billing\PlanGatewaySyncService;
use Illuminate\Console\Command;

class SyncPlans extends Command
{
    protected $signature = 'billing:sync-plans {--plan= : Slug del plan} {--gateway= : stripe|paypal}';

    protected $description = 'Create/update plan products and prices in Stripe and PayPal (current environment).';

    public function handle(PlanGatewaySyncService $service): int
    {
        $plans = Plan::query()
            ->when($this->option('plan'), fn ($q, $slug) => $q->where('slug', $slug))
            ->get();

        foreach ($plans as $plan) {
            $this->option('gateway')
                ? $service->syncGateway($plan, $this->option('gateway'))
                : $service->sync($plan);
        }

        $this->table(
            ['plan', 'gateway', 'env', 'status', 'product', 'price/plan', 'error'],
            $plans->flatMap(fn (Plan $p) => $p->gatewaySyncs()->get()->map(fn ($s) => [
                $p->slug, $s->gateway, $s->environment, $s->status,
                $s->external_product_id,
                $s->external_price_id ?? $s->external_plan_id,
                mb_substr((string) $s->last_error, 0, 80),
            ]))->all()
        );

        return self::SUCCESS;
    }
}