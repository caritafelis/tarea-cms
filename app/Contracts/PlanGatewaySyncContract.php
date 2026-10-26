<?php

namespace App\Contracts;

use App\Models\Plan;
use App\Models\PlanGatewaySync;

interface PlanGatewaySyncContract
{
    public function syncPlan(Plan $plan, PlanGatewaySync $sync): void;
}