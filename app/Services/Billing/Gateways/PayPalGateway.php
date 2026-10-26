<?php

namespace App\Services\Billing\Gateways;

use App\Contracts\{PaymentGatewayContract, PlanGatewaySyncContract};
use App\Models\{Invoice, Plan, PlanGatewaySync, Subscription, SubscriptionPaymentMethod, User};
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Http\Request;

/**
 * PayPal usa REST puro (Subscriptions API v1), así que aquí se llama
 * directo con Http:: en vez de un SDK. Requiere en config/billing.php:
 * gateways.paypal.client_id / client_secret / mode (sandbox|live).
 *
 * NOTA: los métodos están completos en su estructura pero los payloads
 * exactos de PayPal (billing plans, product ids, etc.) hay que crearlos
 * primero desde su dashboard o API y guardarlos en la tabla "plans"
 * (columna gateway_price_id = el "plan_id" de PayPal).
 */
class PayPalGateway implements PaymentGatewayContract, PlanGatewaySyncContract
{
    public function __construct(protected array $config) {}

    public function name(): string
    {
        return 'paypal';
    }

    protected function baseUrl(): string
    {
        return ($this->config['mode'] ?? 'sandbox') === 'live'
            ? 'https://api-m.paypal.com'
            : 'https://api-m.sandbox.paypal.com';
    }

    protected function accessToken(): string
    {
        return Cache::remember('paypal.token.'.($this->config['mode'] ?? 'sandbox'), now()->addHours(6), function () {
            return Http::asForm()
                ->withBasicAuth($this->config['client_id'] ?? '', $this->config['client_secret'] ?? '')
                ->post($this->baseUrl().'/v1/oauth2/token', ['grant_type' => 'client_credentials'])
                ->throw()
                ->json('access_token');
        });
    }

    protected function client()
    {
        return Http::withToken($this->accessToken())->baseUrl($this->baseUrl());
    }

    public function createSubscription(User $user, Plan $plan, Subscription $subscription): string
    {
        $response = $this->client()
            ->withHeaders(['PayPal-Request-Id' => "sub-{$subscription->id}-{$plan->id}"])
            ->post('/v1/billing/subscriptions', [
                'plan_id'    => $this->requirePlanId($plan),
                'custom_id'  => (string) $subscription->id,
                'subscriber' => ['email_address' => $user->email],
                'application_context' => [
                    'brand_name'  => config('app.name'),
                    'user_action' => 'SUBSCRIBE_NOW',
                    'return_url'  => route('onboarding.paypal.return'),
                    'cancel_url'  => route('onboarding.show'),
                ],
            ])
            ->throw();
            
        $subscription->update(['stripe_id' => $response->json('id'), 'plan_id' => $plan->id]);

        return collect($response->json('links'))->firstWhere('rel', 'approve')['href'];
    }

    public function createCheckoutUrl(User $user, Plan $plan): string
    {
        $response = $this->client()->post('/v1/billing/subscriptions', [
            'plan_id' => $this->requirePlanId($plan),
            'subscriber' => ['email_address' => $user->email],
            'application_context' => [
                'return_url' => route('admin.settings.index').'?checkout=success',
                'cancel_url' => route('admin.settings.index').'?checkout=cancelled',
            ],
        ])->throw();

        $links = collect($response->json('links', []));

        return $links->firstWhere('rel', 'approve')['href'] ?? route('admin.settings.index');
    }

    public function swapPlan(Subscription $subscription, Plan $plan): Subscription
    {
        // PayPal no permite "swap" directo de plan en una suscripción activa:
        // se revisa/actualiza vía "revise" endpoint.
        $planId = $this->requirePlanId($plan);

        $this->client()->post("/v1/billing/subscriptions/{$subscription->stripe_id}/revise", [
            'plan_id' => $planId,
        ])->throw();

        $subscription->update(['plan_id' => $plan->id, 'stripe_price' => $planId]);

        return $subscription->fresh();
    }

    public function cancel(Subscription $subscription): Subscription
    {
        $this->client()->post("/v1/billing/subscriptions/{$subscription->stripe_id}/cancel", [
            'reason' => 'Cancelled by customer',
        ]);

        $subscription->update(['auto_renew' => false, 'stripe_status' => 'canceled', 'ends_at' => now()]);

        return $subscription->fresh();
    }

    public function resume(Subscription $subscription): Subscription
    {
        $this->client()->post("/v1/billing/subscriptions/{$subscription->stripe_id}/activate", [
            'reason' => 'Reactivated by customer',
        ]);

        $subscription->update(['auto_renew' => true, 'stripe_status' => 'active', 'ends_at' => null]);

        return $subscription->fresh();
    }

    public function verifyWebhook(Request $request): bool
    {
        $res = $this->client()->post('/v1/notifications/verify-webhook-signature', [
            'auth_algo'         => $request->header('PAYPAL-AUTH-ALGO'),
            'cert_url'          => $request->header('PAYPAL-CERT-URL'),
            'transmission_id'   => $request->header('PAYPAL-TRANSMISSION-ID'),
            'transmission_sig'  => $request->header('PAYPAL-TRANSMISSION-SIG'),
            'transmission_time' => $request->header('PAYPAL-TRANSMISSION-TIME'),
            'webhook_id'        => $this->config['webhook_id'],
            'webhook_event'     => $request->json()->all(),
        ]);

        return $res->successful() && $res->json('verification_status') === 'SUCCESS';
    }

    public function attachPaymentMethod(User $user, string $gatewayToken, ?string $cardholderName = null): SubscriptionPaymentMethod
    {
        return SubscriptionPaymentMethod::create([
            'user_id' => $user->id,
            'gateway' => $this->name(),
            'gateway_payment_method_id' => $gatewayToken,
            'type' => 'paypal_account',
            'is_primary' => ! $user->paymentMethods()->exists(),
        ]);
    }

    public function setDefaultPaymentMethod(SubscriptionPaymentMethod $method): void
    {
        $method->user->paymentMethods()->update(['is_primary' => false]);
        $method->update(['is_primary' => true]);
    }

    public function deletePaymentMethod(SubscriptionPaymentMethod $method): void
    {
        $method->delete();
    }

    public function syncInvoices(User $user): void
    {
        $subscriptionIds = Subscription::where('user_id', $user->id)
            ->where('gateway', $this->name())
            ->pluck('stripe_id');

        foreach ($subscriptionIds as $subscriptionId) {
            $response = $this->client()->get("/v1/billing/subscriptions/{$subscriptionId}/transactions", [
                'start_time' => now()->subYear()->toIso8601String(),
                'end_time' => now()->toIso8601String(),
            ]);

            foreach ($response->json('transactions', []) as $tx) {
                Invoice::updateOrCreate(
                    ['gateway_invoice_id' => $tx['id']],
                    [
                        'user_id' => $user->id,
                        'gateway' => $this->name(),
                        'number' => $tx['id'],
                        'amount_cents' => (int) round(((float) $tx['amount_with_breakdown']['gross_amount']['value']) * 100),
                        'currency' => strtolower($tx['amount_with_breakdown']['gross_amount']['currency_code']),
                        'status' => $tx['status'] === 'COMPLETED' ? 'paid' : 'open',
                        'paid_at' => $tx['time'] ?? null,
                        'pdf_url' => null, // PayPal no expone PDF directo; se puede generar propio
                    ]
                );
            }
        }
    }

    public function syncPlan(Plan $plan, PlanGatewaySync $sync): void
    {
        if ($plan->price_cents <= 0) {
            throw new \InvalidArgumentException('PayPal does not support recurring plans with a zero price.');
        }

        $intervalUnit = match ($plan->interval) {
            'month' => 'MONTH',
            'year' => 'YEAR',
            default => throw new \InvalidArgumentException("Unsupported billing interval [{$plan->interval}]."),
        };

        // Solo lo que obliga a crear un billing plan nuevo (PayPal no permite cambiar precio/intervalo).
        $configurationHash = hash('sha256', json_encode([
            'price_cents' => $plan->price_cents,
            'currency' => strtoupper($plan->currency),
            'interval' => $plan->interval,
        ], JSON_THROW_ON_ERROR));

        $productId = $sync->external_product_id;

        if (! $productId) {
            $productId = $this->client()
                ->withHeaders(['PayPal-Request-Id' => "pp-prod-{$plan->id}-{$sync->environment}"])
                ->post('/v1/catalogs/products', [
                    'name' => $plan->name,
                    'description' => "Subscription plan {$plan->slug}",
                    'type' => 'SERVICE',
                    'category' => 'SOFTWARE',
                ])
                ->throw()
                ->json('id');

            if (! is_string($productId) || $productId === '') {
                throw new \RuntimeException('PayPal did not return a product ID.');
            }

            $sync->update(['external_product_id' => $productId]);
        }

        $externalPlanId = $sync->external_plan_id;
        $unchanged = $sync->status === 'synced'
            && $sync->configuration_hash === $configurationHash
            && $externalPlanId;

        if (! $unchanged) {
            $externalPlanId = $this->client()
                ->withHeaders(['PayPal-Request-Id' => 'pp-plan-'.$plan->id.'-'.substr($configurationHash, 0, 16)])
                ->post('/v1/billing/plans', [
                    'product_id' => $productId,
                    'name' => $plan->name.' '.strtoupper($plan->interval),
                    'description' => "Recurring subscription: {$plan->slug}",
                    'status' => 'ACTIVE',
                    'billing_cycles' => [[
                        'frequency' => [
                            'interval_unit' => $intervalUnit,
                            'interval_count' => 1,
                        ],
                        'tenure_type' => 'REGULAR',
                        'sequence' => 1,
                        'total_cycles' => 0,
                        'pricing_scheme' => [
                            'fixed_price' => [
                                'value' => number_format($plan->price_cents / 100, 2, '.', ''),
                                'currency_code' => strtoupper($plan->currency),
                            ],
                        ],
                    ]],
                    'payment_preferences' => [
                        'auto_bill_outstanding' => true,
                        'setup_fee_failure_action' => 'CONTINUE',
                        'payment_failure_threshold' => 3,
                    ],
                ])
                ->throw()
                ->json('id');

            if (! is_string($externalPlanId) || $externalPlanId === '') {
                throw new \RuntimeException('PayPal did not return a billing plan ID.');
            }
        }

        // Estado activo/inactivo del plan en PayPal (no requiere plan nuevo).
        $currentStatus = $this->client()->get("/v1/billing/plans/{$externalPlanId}")->throw()->json('status');
        $wanted = $plan->is_active ? 'ACTIVE' : 'INACTIVE';

        if ($currentStatus !== $wanted) {
            $this->client()
                ->post("/v1/billing/plans/{$externalPlanId}/".($plan->is_active ? 'activate' : 'deactivate'))
                ->throw();
        }

        $sync->update([
            'status' => 'synced',
            'external_product_id' => $productId,
            'external_plan_id' => $externalPlanId,
            'external_price_id' => null,
            'configuration_hash' => $configurationHash,
            'synced_at' => now(),
            'last_error' => null,
        ]);

        $gatewayIds = $plan->gateway_ids ?? [];
        data_set($gatewayIds, 'paypal.product_id', $productId);
        data_set($gatewayIds, 'paypal.plan_id', $externalPlanId);

        $plan->forceFill([
            'gateway_ids' => $gatewayIds,
            'gateway_price_id' => $plan->gateway === 'paypal'
                ? $externalPlanId
                : $plan->gateway_price_id,
        ])->saveQuietly();
    }

    protected function requirePlanId(Plan $plan): string
    {
        $planId = $plan->gatewayPriceId('paypal');

        if (! $planId) {
            throw new \DomainException("Plan [{$plan->slug}] is not synchronized with PayPal yet.");
        }

        return $planId;
    }
}