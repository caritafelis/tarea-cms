<?php

namespace App\Services\Billing\Gateways;

use App\Contracts\PaymentGatewayContract;
use App\Models\Invoice;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\SubscriptionPaymentMethod;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

/**
 * Nuvei no tiene un paquete Laravel oficial: se integra vía su REST API
 * (Nuvei "OPPWA"/REST) con autenticación por checksum SHA-256, tal como
 * pide su documentación. Ajusta las rutas exactas del endpoint según
 * el producto Nuvei que uses (Simply Connect / OPPWA / etc.) — la
 * estructura del contrato es la misma que para Stripe y PayPal.
 *
 * Config esperada: gateways.nuvei.merchant_id, .merchant_site_id, .secret_key, .env
 */
class NuveiGateway implements PaymentGatewayContract
{
    public function __construct(protected array $config) {}

    public function name(): string
    {
        return 'nuvei';
    }

    protected function baseUrl(): string
    {
        return ($this->config['env'] ?? 'test') === 'live'
            ? 'https://secure.safecharge.com/ppp/api/v1'
            : 'https://ppp-test.safecharge.com/ppp/api/v1';
    }

    protected function checksum(array $fields): string
    {
        // Nuvei firma cada request concatenando ciertos campos + secret key.
        return hash('sha256', implode('', $fields).($this->config['secret_key'] ?? ''));
    }

    protected function client()
    {
        return Http::baseUrl($this->baseUrl())->timeout(10);
    }

    public function createCheckoutUrl(User $user, Plan $plan): string
    {
        if (empty($this->config['merchant_id']) || empty($this->config['merchant_site_id']) || empty($this->config['secret_key'])) {
            throw new \RuntimeException('Nuvei is not configured.');
        }

        $clientRequestId = (string) Str::uuid();

        $response = $this->client()->post('/openOrder.do', [
            'merchantId' => $this->config['merchant_id'] ?? '',
            'merchantSiteId' => $this->config['merchant_site_id'] ?? '',
            'clientRequestId' => $clientRequestId,
            'amount' => number_format($plan->price_cents / 100, 2, '.', ''),
            'currency' => strtoupper($plan->currency),
            'userTokenId' => (string) $user->id,
            'checksum' => $this->checksum([$this->config['merchant_id'] ?? '', $clientRequestId]),
        ]);

        $response->throw();

        $url = $response->json('paymentUrl');

        if (! is_string($url) || $url === '') {
            throw new \RuntimeException('Nuvei did not return a payment URL.');
        }

        return $url;
    }

    public function swapPlan(Subscription $subscription, Plan $plan): Subscription
    {
        // Nuvei no maneja "suscripciones" nativas como Stripe: normalmente
        // se implementa con cobros recurrentes (DMN) manejados por tu propio
        // scheduler. Aquí solo se actualiza el registro local; el cobro real
        // del nuevo monto se dispara en el próximo ciclo vía tu job de billing.
        $subscription->update(['plan_id' => $plan->id, 'stripe_price' => $plan->gateway_price_id]);

        return $subscription->fresh();
    }

    public function cancel(Subscription $subscription): Subscription
    {
        $subscription->update(['auto_renew' => false, 'stripe_status' => 'canceled', 'ends_at' => now()]);

        return $subscription->fresh();
    }

    public function resume(Subscription $subscription): Subscription
    {
        $subscription->update(['auto_renew' => true, 'stripe_status' => 'active', 'ends_at' => null]);

        return $subscription->fresh();
    }

    public function attachPaymentMethod(User $user, string $gatewayToken, ?string $cardholderName = null): SubscriptionPaymentMethod
    {
        // $gatewayToken aquí es el "userPaymentOptionId" que devuelve Nuvei
        // tras tokenizar la tarjeta desde su Web SDK (Simply Connect).
        return SubscriptionPaymentMethod::create([
            'user_id' => $user->id,
            'gateway' => $this->name(),
            'gateway_payment_method_id' => $gatewayToken,
            'type' => 'card',
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
        // Nuvei entrega los cobros vía DMN (webhooks) o el reporte de
        // transacciones de su back office; lo típico es guardar cada
        // transacción exitosa como Invoice en el propio webhook handler
        // en vez de "pull" aquí. Se deja el método por contrato, pero
        // en la práctica esta sincronización ocurre en tiempo real
        // desde un controlador de webhook dedicado (no incluido aquí).
    }

    // ------------------------------------------------------------------
    // Paymentez (Nuvei Ecuador): cobro con token de tarjeta.
    // Usa api_url / server_code / server_key de config/billing.php.
    // ------------------------------------------------------------------

    protected function paymentezUrl(): string
    {
        return rtrim($this->config['api_url'] ?? 'https://ccapi-stg.paymentez.com', '/');
    }

    protected function authToken(): string
    {
        $timestamp = (string) time();
        $uniqToken = hash('sha256', ($this->config['server_key'] ?? '').$timestamp);

        return base64_encode(($this->config['server_code'] ?? '').';'.$timestamp.';'.$uniqToken);
    }

    /** Total a cobrar en centavos: precio del plan + IVA (billing.vat_percentage). */
    public function totalCents(Plan $plan): int
    {
        $vat = (int) round($plan->price_cents * (float) config('billing.vat_percentage', 0) / 100);

        return $plan->price_cents + $vat;
    }

    /**
     * Cobra un token de tarjeta. Devuelve ['ok','id','message'].
     * Lanza excepción solo ante fallos TÉCNICOS (red, 5xx, credenciales); un rechazo
     * de la tarjeta devuelve ok=false (para no cambiar de proveedor por una tarjeta rechazada).
     *
     * @return array{ok:bool,id:?string,authorization_code:?string,message:?string}
     */
    public function chargeCard(User $user, Plan $plan, string $token, string $reference): array
    {
        $total = $this->totalCents($plan);
        $vat = $total - $plan->price_cents;

        $response = Http::withHeaders(['Auth-Token' => $this->authToken()])
            ->acceptJson()
            ->timeout(30)
            ->post($this->paymentezUrl().'/v2/transaction/debit', [
                'user' => ['id' => (string) $user->id, 'email' => $user->email],
                'order' => [
                    'amount' => round($total / 100, 2),
                    'description' => $plan->name,
                    'dev_reference' => $reference,
                    'vat' => round($vat / 100, 2),
                    'taxable_amount' => round($plan->price_cents / 100, 2),
                    'tax_percentage' => (float) config('billing.vat_percentage', 0),
                ],
                'card' => ['token' => $token],
            ]);

        if ($response->serverError() || in_array($response->status(), [401, 403], true)) {
            throw new \RuntimeException('Nuvei is unavailable or rejected our credentials (HTTP '.$response->status().').');
        }

        $tx = $response->json('transaction') ?? [];

        // Nuvei: aprobada SOLO con status = success Y status_detail = 3.
        if ($response->successful()
            && ($tx['status'] ?? null) === 'success'
            && (int) ($tx['status_detail'] ?? 0) === 3) {
            $id = (string) ($tx['id'] ?? $reference);

            Invoice::updateOrCreate(
                ['gateway_invoice_id' => $id],
                [
                    'user_id' => $user->id,
                    'gateway' => $this->name(),
                    'number' => $id,
                    'amount_cents' => $total,
                    'currency' => strtolower($plan->currency),
                    'status' => 'paid',
                    'paid_at' => now(),
                    'pdf_url' => null,
                ]
            );

            // Nuvei exige notificar al cliente con transaction_id y authorization_code.
            try {
                app(\App\Services\Billing\PaymentConfirmationNotifier::class)->send($user, [
                    'name' => $user->name,
                    'planName' => $plan->name,
                    'interval' => $plan->interval,
                    'amount' => strtoupper($plan->currency).' '.number_format($total / 100, 2),
                    'transactionId' => $id,
                    'authorizationCode' => (string) ($tx['authorization_code'] ?? ''),
                    'date' => now()->format('M j, Y H:i'),
                    'appName' => config('app.name'),
                ]);
            } catch (\Throwable $e) {
                report($e); // un fallo de correo nunca debe deshacer un cobro aprobado
            }

            return ['ok' => true, 'id' => $id, 'authorization_code' => $tx['authorization_code'] ?? null, 'message' => null];
        }

        return [
            'ok' => false,
            'id' => null,
            'authorization_code' => null,
            'message' => $tx['message'] ?? $response->json('error.description') ?? 'The card was declined.',
        ];
    }

    /** Cobra la renovación con la tarjeta principal guardada. true = cobrado y renovado. */
    public function renew(Subscription $subscription): bool
    {
        $plan = $subscription->plan;
        $user = $subscription->user;
        $method = $user?->paymentMethods()
            ->where('gateway', $this->name())
            ->orderByDesc('is_primary')
            ->first();

        if (! $plan || ! $user || ! $method) {
            return false;
        }

        try {
            $result = $this->chargeCard(
                $user,
                $plan,
                $method->gateway_payment_method_id,
                "renew-{$subscription->id}-".Str::uuid()
            );
        } catch (\Throwable $e) {
            report($e);

            return false;
        }

        if (! $result['ok']) {
            return false;
        }

        $subscription->update([
            'stripe_status' => 'active',
            'renewal_attempts' => 0,
            'ends_at' => null,
            'renews_at' => $plan->interval === 'year' ? now()->addYear() : now()->addMonth(),
        ]);

        Cache::forget("team:{$subscription->team_id}:entitlements");

        return true;
    }

    /**
     * Valida el "stoken" del callback: md5(transaction_id_application_code_user_id_app_key).
     * Verifica la fórmula exacta contra https://developers.paymentez.com/api/#webhook
     */
    public function verifyWebhookToken(array $payload): bool
    {
        $tx = $payload['transaction'] ?? [];

        $expected = md5(
            ($tx['id'] ?? '').'_'
            .($this->config['server_code'] ?? '').'_'
            .($payload['user']['id'] ?? '').'_'
            .($this->config['server_key'] ?? '')
        );

        return $expected !== '' && hash_equals($expected, (string) ($tx['stoken'] ?? ''));
    }

    /**
     * Reembolso total (sin $amountCents) o parcial. Nuvei lo exige a todos los comercios.
     *
     * @return array{ok:bool,message:?string}
     */
    public function refund(string $transactionId, ?int $amountCents = null): array
    {
        $body = ['transaction' => ['id' => $transactionId]];

        if ($amountCents !== null) {
            $body['order'] = ['amount' => round($amountCents / 100, 2)];
        }

        $response = Http::withHeaders(['Auth-Token' => $this->authToken()])
            ->acceptJson()
            ->timeout(30)
            ->post($this->paymentezUrl().'/v2/transaction/refund', $body);

        return [
            'ok' => $response->successful() && $response->json('status') === 'success',
            'message' => $response->json('detail') ?? $response->json('error.description'),
        ];
    }
}