<?php

namespace App\Observers;

use App\Models\Plan;
use App\Services\Billing\PlanGatewaySyncService;

class PlanObserver
{
    public function created(Plan $plan): void
    {
        app(PlanGatewaySyncService::class)->sync($plan);
    }

    public function updated(Plan $plan): void
    {
        if ($plan->wasChanged([
            'name',
            'slug',
            'price_cents',
            'currency',
            'interval',
            'is_active',
        ])) {
            app(PlanGatewaySyncService::class)->sync($plan);
        }
    }
}