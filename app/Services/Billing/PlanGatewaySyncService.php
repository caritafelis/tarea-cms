<?php

namespace App\Services\Billing;

use App\Contracts\PlanGatewaySyncContract;
use App\Models\Plan;
use App\Models\PlanGatewaySync;
use Illuminate\Support\Facades\Log;
use Throwable;

class PlanGatewaySyncService
{
    public const SUPPORTED = ['stripe', 'paypal', 'nuvei'];

    public function sync(Plan $plan): void
    {
        foreach ($this->gateways() as $gateway) {
            $this->syncGateway($plan, $gateway);
        }
    }

    public function syncGateway(Plan $plan, string $gateway): void
    {
        $gateway = strtolower($gateway);

        if (! in_array($gateway, self::SUPPORTED, true)) {
            throw new \InvalidArgumentException("Unsupported payment gateway [{$gateway}].");
        }

        $environment = self::environmentFor($gateway);

        $sync = PlanGatewaySync::query()->firstOrCreate(
            ['plan_id' => $plan->id, 'gateway' => $gateway, 'environment' => $environment],
            ['status' => 'pending']
        );

        if ($gateway === 'nuvei') {
            $sync->update([
                'status' => 'unsupported',
                'last_error' => 'Automatic recurring plan provisioning is not implemented for Nuvei.',
            ]);

            return;
        }

        $driver = app(PaymentGatewayManager::class)->driver($gateway);

        if (! $driver instanceof PlanGatewaySyncContract) {
            $sync->update([
                'status' => 'unsupported',
                'last_error' => "The {$gateway} gateway does not implement PlanGatewaySyncContract.",
            ]);

            return;
        }

        $sync->update(['status' => 'syncing', 'last_error' => null]);

        try {
            // Sin DB::transaction a propósito: si Stripe/PayPal ya crearon algo,
            // los IDs guardados no deben revertirse por un fallo posterior.
            $driver->syncPlan($plan->fresh(), $sync->fresh());
        } catch (Throwable $exception) {
            $sync->refresh()->update([
                'status' => 'failed',
                'last_error' => mb_substr($exception->getMessage(), 0, 65000),
            ]);

            Log::error('Plan gateway synchronization failed.', [
                'plan_id' => $plan->id,
                'gateway' => $gateway,
                'environment' => $environment,
                'exception' => $exception,
            ]);
        }
    }

    public function retry(Plan $plan): void
    {
        $this->sync($plan);
    }

    /** @return list<string> */
    private function gateways(): array
    {
        $configured = array_map('strtolower', (array) config('billing.plan_sync_gateways', []));

        // PayPal y Stripe siempre activos: el cliente puede pagar con PayPal o con tarjeta (respaldo Stripe).
        $gateways = array_merge(['stripe', 'paypal'], $configured);

        return array_values(array_intersect(self::SUPPORTED, array_unique($gateways)));
    }

    /**
     * Única fuente de verdad del entorno (la usa también Plan::gatewayIdentifier).
     * Stripe se deduce de la clave secreta: la config no tiene "env" para Stripe.
     */
    public static function environmentFor(string $gateway): string
    {
        $live = match (strtolower($gateway)) {
            'stripe' => str_starts_with((string) config('billing.gateways.stripe.secret_key'), 'sk_live_')
                || str_starts_with((string) config('billing.gateways.stripe.secret_key'), 'rk_live_'),
            'paypal' => in_array(config('billing.gateways.paypal.mode', 'sandbox'), ['live', 'production'], true),
            'nuvei' => in_array(config('billing.gateways.nuvei.js_env', 'stg'), ['prod', 'production', 'live'], true),
            default => false,
        };

        return $live ? 'live' : 'sandbox';
    }
}