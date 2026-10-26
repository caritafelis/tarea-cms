<?php

namespace App\Services\Billing;

use App\Contracts\PaymentGatewayContract;
use App\Services\Billing\Gateways\NuveiGateway;
use App\Services\Billing\Gateways\PayPalGateway;
use App\Services\Billing\Gateways\StripeGateway;
use Illuminate\Support\Manager;

/**
 * Uso:
 *   app(PaymentGatewayManager::class)->driver();          // el default de config/billing.php
 *   app(PaymentGatewayManager::class)->driver('paypal');  // uno explícito (ej. porque el plan lo pide)
 *
 * Cada driver individual (Stripe/PayPal/Nuvei) sí implementa
 * PaymentGatewayContract; el Manager solo resuelve cuál instanciar.
 */
class PaymentGatewayManager extends Manager
{
    public function getDefaultDriver(): string
    {
        return config('billing.default_gateway', 'stripe');
    }

    protected function createStripeDriver(): StripeGateway
    {
        return new StripeGateway(config('billing.gateways.stripe', []));
    }

    protected function createPaypalDriver(): PayPalGateway
    {
        return new PayPalGateway(config('billing.gateways.paypal', []));
    }

    protected function createNuveiDriver(): NuveiGateway
    {
        return new NuveiGateway(config('billing.gateways.nuvei', []));
    }
}
