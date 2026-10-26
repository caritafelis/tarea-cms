<?php

namespace App\Http\Controllers;

use App\Actions\Billing\ActivateSubscription;
use App\Billing\{NuveiGateway, PayPalGateway};
use App\Models\Subscription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class WebhookController extends Controller
{
    public function __invoke(Request $request, string $gateway)
    {
        return match ($gateway) {
            'nuvei' => $this->nuvei($request),
            'paypal' => $this->paypal($request),
            default => abort(404),
        };
    }

    private function nuvei(Request $request)
    {
        $payload = $request->all();
        abort_unless(app(NuveiGateway::class)->validStoken($payload), 401);

        $t = $payload['transaction'] ?? [];
        // dev_reference = "S{subscriptionId}-{fecha}"
        preg_match('/^S(\d+)-/', $t['dev_reference'] ?? '', $m);
        $subscription = isset($m[1]) ? Subscription::with('plan', 'team')->find($m[1]) : null;

        if ($subscription && ($t['status'] ?? null) === 'success' && (int) ($t['status_detail'] ?? 0) === 3) {
            app(ActivateSubscription::class)->handle($subscription, [
                'transaction_id' => $t['id'] ?? null,
                'authorization_code' => $t['authorization_code'] ?? null,
                'amount' => $t['amount'] ?? null,
            ]);
        }

        return response()->json(['status' => 'ok']);
    }

    private function paypal(Request $request)
    {
        abort_unless(app(PayPalGateway::class)->validSignature($request), 401);

        $event = $request->input('event_type');
        $resource = $request->input('resource', []);

        $subscription = Subscription::with('plan', 'team')
            ->where('gateway', 'paypal')
            ->where('stripe_id', $resource['id'] ?? $resource['billing_agreement_id'] ?? '')
            ->first();

        if (! $subscription) {
            return response()->noContent();
        }

        match ($event) {
            'BILLING.SUBSCRIPTION.ACTIVATED', 'PAYMENT.SALE.COMPLETED'
                => app(ActivateSubscription::class)->handle($subscription, [
                    'transaction_id' => $resource['id'] ?? null,
                    'amount' => $resource['amount']['total'] ?? null,
                ]),
            'BILLING.SUBSCRIPTION.CANCELLED', 'BILLING.SUBSCRIPTION.EXPIRED'
                => $subscription->update(['stripe_status' => 'canceled', 'ends_at' => now()]),
            'BILLING.SUBSCRIPTION.SUSPENDED', 'BILLING.SUBSCRIPTION.PAYMENT.FAILED'
                => $subscription->update(['stripe_status' => 'past_due']),
            default => null,
        };

        Cache::forget("team:{$subscription->team_id}:entitlements");

        return response()->noContent();
    }
}