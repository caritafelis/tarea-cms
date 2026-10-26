<?php

namespace App\Jobs;

use App\Models\Plan;
use App\Services\Billing\PlanGatewaySyncService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\Middleware\WithoutOverlapping;

class SyncPlanGateways implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 120;

    public function __construct(public int $planId) {}

    /** @return array<int, object> */
    public function middleware(): array
    {
        return [(new WithoutOverlapping((string) $this->planId))->releaseAfter(10)->expireAfter(300)];
    }

    public function backoff(): array
    {
        return [10, 60];
    }

    public function handle(PlanGatewaySyncService $service): void
    {
        $plan = Plan::find($this->planId);

        if ($plan) {
            $service->sync($plan);
        }
    }
}