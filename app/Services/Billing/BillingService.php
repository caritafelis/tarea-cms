<?php

namespace App\Services\Billing;

use App\Models\Invoice;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\SubscriptionPaymentMethod;
use App\Models\User;

class BillingService
{
    public function __construct(protected PaymentGatewayManager $gateways) {}

    /**
     * Payload completo para el tab de Billing (todas sus 4 sub-vistas).
     */
    public function forUser(User $user): array
    {
        $subscription = $this->currentSubscription($user);
        $plan = $subscription?->plan;
        $subscriberCounts = Subscription::query()
            ->selectRaw('plan_id, count(*) as total')
            ->groupBy('plan_id')
            ->pluck('total', 'plan_id');

        return [
            'contact' => [
                'name' => $user->name,
                'email' => $user->email,
                'alternative_email' => $user->billing_email ?? null,
                'locations' => $user->billing_locations ?? [],
                'status' => $subscription?->active() ? 'active' : 'inactive',
            ],
            'current_plan' => $plan ? [
                'id' => $plan->id,
                'name' => $plan->name,
                'price' => $plan->formattedPrice(),
                'interval' => $plan->interval,
                'features' => $plan->features ?? [],
            ] : null,
            'plans' => Plan::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->get()
                ->map(fn (Plan $p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'slug' => $p->slug,
                    'tier' => $p->tier,
                    'has_ecommerce' => $p->has_ecommerce,
                    'price' => $p->formattedPrice(),
                    'interval' => $p->interval,
                    'features' => $p->features ?? [],
                    'is_current' => $plan?->id === $p->id,
                    'paypal_available' => $p->gatewayPriceId('paypal') !== null,
                ])
                ->values(),
            'manageable_plans' => Plan::query()
                ->with('gatewaySyncs')
                ->orderBy('sort_order')
                ->get()
                ->map(fn (Plan $p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'slug' => $p->slug,
                    'tier' => $p->tier,
                    'has_ecommerce' => (bool) $p->has_ecommerce,
                    'price' => round($p->price_cents / 100, 2),
                    'currency' => $p->currency,
                    'interval' => $p->interval,
                    'gateway' => $p->gateway,
                    'gateway_price_id' => $p->gatewayPriceId('stripe'),
                    'paypal_plan_id' => $p->gatewayPriceId('paypal'),
                    'features' => $p->features ?? [],
                    'is_active' => $p->is_active,
                    'sort_order' => $p->sort_order,
                    'subscribers_count' => (int) ($subscriberCounts[$p->id] ?? 0),
                    'syncs' => $this->syncsFor($p),
                    'checkout_methods' => $this->checkoutMethodsFor($p),
                ])
                ->values(),
            'payment_methods' => SubscriptionPaymentMethod::where('user_id', $user->id)
                ->orderByDesc('is_primary')
                ->get()
                ->map(fn (SubscriptionPaymentMethod $pm) => [
                    'id' => $pm->id,
                    'gateway' => $pm->gateway,
                    'type' => $pm->type,
                    'brand' => $pm->brand,
                    'last_four' => $pm->last_four,
                    'exp_month' => $pm->exp_month,
                    'exp_year' => $pm->exp_year,
                    'is_primary' => $pm->is_primary,
                    'label' => $pm->label(),
                    'is_expired' => $pm->isExpired(),
                ])
                ->values(),
            'invoices' => Invoice::where('user_id', $user->id)
                ->orderByDesc('created_at')
                ->limit(50)
                ->get()
                ->map(fn (Invoice $inv) => [
                    'id' => $inv->id,
                    'number' => $inv->number,
                    'amount' => $inv->formattedAmount(),
                    'status' => $inv->status,
                    'paid_at' => $inv->paid_at?->format('M j, Y'),
                    'pdf_url' => $inv->pdf_url,
                ])
                ->values(),
            'subscription' => $subscription ? [
                'id' => $subscription->id,
                'gateway' => $subscription->gateway,
                'status' => $subscription->stripe_status,
                'auto_renew' => $subscription->auto_renew,
                'ends_at' => $subscription->ends_at?->format('M j, Y'),
                'on_grace_period' => $subscription->onGracePeriod(),
            ] : null,
            'alerts' => [
                'plan_expiring' => $subscription?->onGracePeriod() ? $subscription->ends_at?->format('Y/m/d') : null,
                'incomplete_billing_details' => empty($user->billing_email) || empty($user->billing_locations),
            ],
        ];
    }

    public function currentSubscription(User $user): ?Subscription
    {
        return Subscription::where('user_id', $user->id)
            ->whereIn('stripe_status', ['active', 'trialing'])
            ->latest()
            ->first()
            ?? Subscription::where('user_id', $user->id)->latest()->first();
    }

    /**
     * $method: "card" (Nuvei, con respaldo automático a Stripe) o "paypal".
     * Si ya hay suscripción, el cambio se hace en el gateway de ESA suscripción.
     */
    public function switchPlan(User $user, Plan $plan, ?string $method = null): string
    {
        $subscription = $this->currentSubscription($user);

        if ($subscription) {
            $this->gateways
                ->driver($subscription->gateway ?: $plan->gateway)
                ->swapPlan($subscription, $plan);

            return route('admin.settings.index');
        }

        return $this->checkoutUrl($user, $plan, $method ?? 'card');
    }

    public function checkoutUrl(User $user, Plan $plan, string $method = 'card'): string
    {
        if (! in_array($method, ['card', 'paypal'], true)) {
            throw new \InvalidArgumentException("Unsupported checkout method [{$method}].");
        }

        if ($method === 'paypal') {
            return $this->gateways->driver('paypal')->createCheckoutUrl($user, $plan);
        }

        try {
            return $this->gateways->driver('nuvei')->createCheckoutUrl($user, $plan);
        } catch (\Throwable $e) {
            report($e);

            return $this->gateways->driver('stripe')->createCheckoutUrl($user, $plan);
        }
    }

    public function cancel(User $user): void
    {
        $subscription = $this->currentSubscription($user);

        if ($subscription) {
            $this->gateways->driver($subscription->gateway)->cancel($subscription);
        }
    }

    public function resume(User $user): void
    {
        $subscription = $this->currentSubscription($user);

        if ($subscription) {
            $this->gateways->driver($subscription->gateway)->resume($subscription);
        }
    }

    public function toggleAutoRenew(User $user, bool $enabled): void
    {
        $subscription = $this->currentSubscription($user);

        if (! $subscription) {
            return;
        }

        $enabled ? $this->resume($user) : $this->cancel($user);
    }

    public function attachPaymentMethod(User $user, string $gateway, string $token, ?string $cardholderName = null): SubscriptionPaymentMethod
    {
        return $this->gateways->driver($gateway)->attachPaymentMethod($user, $token, $cardholderName);
    }

    public function setDefaultPaymentMethod(SubscriptionPaymentMethod $method): void
    {
        $this->gateways->driver($method->gateway)->setDefaultPaymentMethod($method);
    }

    public function deletePaymentMethod(SubscriptionPaymentMethod $method): void
    {
        $this->gateways->driver($method->gateway)->deletePaymentMethod($method);
    }

    public function syncInvoices(User $user): void
    {
        foreach (['stripe', 'paypal', 'nuvei'] as $gateway) {
            try {
                $this->gateways->driver($gateway)->syncInvoices($user);
            } catch (\Throwable $e) {
                report($e);
            }
        }
    }

    /**
     * Estado de sincronización por gateway (solo el entorno actual).
     *
     * @return list<array<string, mixed>>
     */
    private function syncsFor(Plan $plan): array
    {
        return collect(PlanGatewaySyncService::SUPPORTED)->map(function (string $gateway) use ($plan) {
            $env = PlanGatewaySyncService::environmentFor($gateway);
            $row = $plan->gatewaySyncs->first(
                fn ($s) => $s->gateway === $gateway && $s->environment === $env
            );

            return [
                'gateway' => $gateway,
                'environment' => $env,
                'status' => $row?->status ?? 'not_synced',
                'external_product_id' => $row?->external_product_id,
                'external_plan_id' => $row?->external_plan_id,
                'external_price_id' => $row?->external_price_id,
                'synced_at' => $row?->synced_at?->format('M j, Y H:i'),
                'last_error' => $row?->last_error,
            ];
        })->all();
    }

    /**
     * Métodos de pago que REALMENTE se pueden usar para este plan:
     * credenciales presentes + (Stripe/PayPal) plan sincronizado.
     *
     * @return list<array{key:string,label:string,active:bool,detail:?string}>
     */
    private function checkoutMethodsFor(Plan $plan): array
    {
        $status = collect($this->syncsFor($plan))->pluck('status', 'gateway');

        $stripeConfigured = filled(config('billing.gateways.stripe.secret_key'));
        $paypalConfigured = filled(config('billing.gateways.paypal.client_id'))
            && filled(config('billing.gateways.paypal.client_secret'));
        // Las claves que NuveiGateway lee hoy. Si adaptas el gateway, ajusta esta lista.
        $nuveiConfigured = filled(config('billing.gateways.nuvei.merchant_id'))
            && filled(config('billing.gateways.nuvei.merchant_site_id'))
            && filled(config('billing.gateways.nuvei.secret_key'));

        $stripeReady = $stripeConfigured && ($status['stripe'] ?? null) === 'synced';
        $paypalReady = $paypalConfigured && ($status['paypal'] ?? null) === 'synced';

        $why = fn (bool $configured, ?string $st) => ! $configured
            ? 'Credentials are not configured'
            : ($st === 'synced' ? null : 'Plan is not synchronized yet');

        $processors = array_values(array_filter([
            $nuveiConfigured ? 'Nuvei' : null,
            $stripeReady ? ($nuveiConfigured ? 'Stripe (fallback)' : 'Stripe') : null,
        ]));

        return [
            [
                'key' => 'card',
                'label' => 'Card',
                'active' => $processors !== [],
                'detail' => $processors !== [] ? implode(' → ', $processors) : 'No card processor is ready',
            ],
            [
                'key' => 'paypal',
                'label' => 'PayPal',
                'active' => $paypalReady,
                'detail' => $why($paypalConfigured, $status['paypal'] ?? null),
            ],
            [
                'key' => 'apple_pay',
                'label' => 'Apple Pay',
                'active' => $stripeReady,
                'detail' => $stripeReady
                    ? 'Via Stripe Checkout (must be enabled in your Stripe dashboard)'
                    : $why($stripeConfigured, $status['stripe'] ?? null),
            ],
            [
                'key' => 'google_pay',
                'label' => 'Google Pay',
                'active' => $stripeReady,
                'detail' => $stripeReady
                    ? 'Via Stripe Checkout (must be enabled in your Stripe dashboard)'
                    : $why($stripeConfigured, $status['stripe'] ?? null),
            ],
        ];
    }
}