<?php

namespace App\Console\Commands;

use App\Models\Subscription;
use App\Services\Billing\PaymentGatewayManager;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class RenewSubscriptions extends Command
{
    protected $signature = 'billing:renew';
    protected $description = 'Charge due Nuvei subscriptions';

    public function handle(PaymentGatewayManager $gateways): void
    {
        Subscription::with('plan', 'user')
            ->where('gateway', 'nuvei')
            ->where('auto_renew', true)
            ->whereIn('stripe_status', ['active', 'past_due'])
            ->where('renews_at', '<=', now())
            ->each(function (Subscription $s) use ($gateways) {
                if ($gateways->driver('nuvei')->renew($s)) {
                    return;
                }

                $attempts = $s->renewal_attempts + 1;

                $s->update($attempts >= 3
                    ? ['stripe_status' => 'canceled', 'ends_at' => now(), 'renewal_attempts' => $attempts]
                    : ['stripe_status' => 'past_due', 'renewal_attempts' => $attempts, 'renews_at' => now()->addDay()]);

                Cache::forget("team:{$s->team_id}:entitlements");
            });
    }
}