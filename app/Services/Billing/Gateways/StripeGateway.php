<?php

namespace App\Services\Billing\Gateways;

use App\Contracts\{PaymentGatewayContract, PlanGatewaySyncContract};
use App\Models\{Invoice, Plan, PlanGatewaySync, Subscription, SubscriptionPaymentMethod, User};
use Carbon\Carbon;
use Stripe\StripeClient;

/**
 * Requiere: composer require stripe/stripe-php
 * Config esperada en config/billing.php -> gateways.stripe.secret_key
 */
class StripeGateway implements PaymentGatewayContract, PlanGatewaySyncContract
{
    protected StripeClient $client;

    public function __construct(protected array $config)
    {
        $this->client = new StripeClient($config['secret_key'] ?? '');
    }

    public function name(): string
    {
        return 'stripe';
    }

    public function createCheckoutUrl(User $user, Plan $plan): string
    {
        $priceId = $this->requirePriceId($plan);

        $session = $this->client->checkout->sessions->create([
            'mode' => 'subscription',
            'customer_email' => $user->email,
            'line_items' => [[
                'price' => $priceId,
                'quantity' => 1,
            ]],
            'success_url' => route('admin.settings.index').'?checkout=success',
            'cancel_url' => route('admin.settings.index').'?checkout=cancelled',
            'metadata' => ['user_id' => $user->id, 'plan_id' => $plan->id],
        ]);

        return $session->url;
    }

    public function swapPlan(Subscription $subscription, Plan $plan): Subscription
    {
        $priceId = $this->requirePriceId($plan);

        $stripeSubscription = $this->client->subscriptions->retrieve($subscription->stripe_id);

        $this->client->subscriptions->update($subscription->stripe_id, [
            'items' => [[
                'id' => $stripeSubscription->items->data[0]->id,
                'price' => $priceId,
            ]],
            'proration_behavior' => 'create_prorations',
        ]);

        $subscription->update([
            'plan_id' => $plan->id,
            'stripe_price' => $priceId,
        ]);

        return $subscription->fresh();
    }

    public function cancel(Subscription $subscription): Subscription
    {
        $stripeSubscription = $this->client->subscriptions->update($subscription->stripe_id, [
            'cancel_at_period_end' => true,
        ]);

        $subscription->update([
            'auto_renew' => false,
            'ends_at' => Carbon::createFromTimestamp(
                $stripeSubscription->cancel_at
                    ?? $stripeSubscription->items->data[0]->current_period_end
                    ?? now()->addMonth()->timestamp
            ),
        ]);

        return $subscription->fresh();
    }

    public function resume(Subscription $subscription): Subscription
    {
        $this->client->subscriptions->update($subscription->stripe_id, [
            'cancel_at_period_end' => false,
        ]);

        $subscription->update(['auto_renew' => true, 'ends_at' => null]);

        return $subscription->fresh();
    }

    public function attachPaymentMethod(User $user, string $gatewayToken, ?string $cardholderName = null): SubscriptionPaymentMethod
    {
        $stripeCustomerId = $user->stripe_id ?? $this->createCustomer($user);

        $this->client->paymentMethods->attach($gatewayToken, ['customer' => $stripeCustomerId]);
        $pm = $this->client->paymentMethods->retrieve($gatewayToken);

        return SubscriptionPaymentMethod::create([
            'user_id' => $user->id,
            'gateway' => $this->name(),
            'gateway_payment_method_id' => $pm->id,
            'type' => 'card',
            'brand' => $pm->card->brand ?? null,
            'last_four' => $pm->card->last4 ?? null,
            'exp_month' => $pm->card->exp_month ?? null,
            'exp_year' => $pm->card->exp_year ?? null,
            'is_primary' => ! $user->paymentMethods()->exists(),
        ]);
    }

    public function setDefaultPaymentMethod(SubscriptionPaymentMethod $method): void
    {
        $user = $method->user;

        $this->client->customers->update($user->stripe_id, [
            'invoice_settings' => ['default_payment_method' => $method->gateway_payment_method_id],
        ]);

        $user->paymentMethods()->update(['is_primary' => false]);
        $method->update(['is_primary' => true]);
    }

    public function deletePaymentMethod(SubscriptionPaymentMethod $method): void
    {
        $this->client->paymentMethods->detach($method->gateway_payment_method_id);
        $method->delete();
    }

    public function syncInvoices(User $user): void
    {
        if (! $user->stripe_id) {
            return;
        }

        $invoices = $this->client->invoices->all(['customer' => $user->stripe_id, 'limit' => 20]);

        foreach ($invoices->data as $stripeInvoice) {
            Invoice::updateOrCreate(
                ['gateway_invoice_id' => $stripeInvoice->id],
                [
                    'user_id' => $user->id,
                    'gateway' => $this->name(),
                    'number' => $stripeInvoice->number ?? $stripeInvoice->id,
                    'amount_cents' => $stripeInvoice->amount_paid,
                    'currency' => $stripeInvoice->currency,
                    'status' => $stripeInvoice->status,
                    'paid_at' => $stripeInvoice->status_transitions->paid_at
                        ? Carbon::createFromTimestamp($stripeInvoice->status_transitions->paid_at)
                        : null,
                    'pdf_url' => $stripeInvoice->invoice_pdf,
                ]
            );
        }
    }

    public function syncPlan(Plan $plan, PlanGatewaySync $sync): void
    {
        // Solo lo que obliga a crear un Price nuevo (los Prices de Stripe son inmutables).
        $configurationHash = hash('sha256', json_encode([
            'price_cents' => $plan->price_cents,
            'currency' => strtolower($plan->currency),
            'interval' => $plan->interval,
        ], JSON_THROW_ON_ERROR));

        $productId = $sync->external_product_id;

        if (! $productId) {
            $productId = $this->client->products->create(
                [
                    'name' => $plan->name,
                    'active' => (bool) $plan->is_active,
                    'metadata' => [
                        'internal_plan_id' => (string) $plan->id,
                        'internal_plan_slug' => $plan->slug,
                    ],
                ],
                ['idempotency_key' => "plan-product-{$plan->id}-{$sync->environment}"]
            )->id;

            $sync->update(['external_product_id' => $productId]);
        } else {
            // Nombre y estado activo se pueden actualizar sin crear nada nuevo.
            $this->client->products->update($productId, [
                'name' => $plan->name,
                'active' => (bool) $plan->is_active,
            ]);
        }

        $priceId = $sync->external_price_id;

        if (
            $sync->status !== 'synced'
            || $sync->configuration_hash !== $configurationHash
            || ! $priceId
        ) {
            $priceId = $this->client->prices->create(
                [
                    'product' => $productId,
                    'unit_amount' => $plan->price_cents,
                    'currency' => strtolower($plan->currency),
                    'recurring' => [
                        'interval' => $plan->interval,
                        'interval_count' => 1,
                    ],
                    'metadata' => [
                        'internal_plan_id' => (string) $plan->id,
                        'internal_plan_slug' => $plan->slug,
                    ],
                ],
                ['idempotency_key' => 'plan-price-'.$plan->id.'-'.$sync->environment.'-'.substr($configurationHash, 0, 24)]
            )->id;
        }

        $sync->update([
            'status' => 'synced',
            'external_product_id' => $productId,
            'external_price_id' => $priceId,
            'external_plan_id' => null,
            'configuration_hash' => $configurationHash,
            'synced_at' => now(),
            'last_error' => null,
        ]);

        $gatewayIds = $plan->gateway_ids ?? [];
        data_set($gatewayIds, 'stripe.product_id', $productId);
        data_set($gatewayIds, 'stripe.price_id', $priceId);

        $plan->forceFill([
            'gateway_ids' => $gatewayIds,
            'gateway_price_id' => $plan->gateway === 'stripe'
                ? $priceId
                : $plan->gateway_price_id,
        ])->saveQuietly();
    }

    protected function requirePriceId(Plan $plan): string
    {
        $priceId = $plan->gatewayPriceId('stripe');

        if (! $priceId) {
            throw new \DomainException("Plan [{$plan->slug}] is not synchronized with Stripe yet.");
        }

        return $priceId;
    }

    protected function createCustomer(User $user): string
    {
        $customer = $this->client->customers->create(['email' => $user->email, 'name' => $user->name]);
        $user->update(['stripe_id' => $customer->id]);

        return $customer->id;
    }
}