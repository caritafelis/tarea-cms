<?php

namespace App\Http\Controllers\Api;

use App\Enums\Payment\TransactionStatus;
use App\Enums\Payment\TransactionType;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment\PaymentTransaction;
use Illuminate\Http\Request;
use Stripe\Exception\SignatureVerificationException;
use Stripe\Webhook;

class PaymentWebhookController extends Controller
{
    public function handle(Request $request)
    {
        $payload = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');
        $endpointSecret = config('services.stripe.webhook_secret', env('STRIPE_WEBHOOK_SECRET'));

        try {
            $event = Webhook::constructEvent($payload, $sigHeader, $endpointSecret);
        } catch (\UnexpectedValueException $e) {
            return response()->json(['error' => 'Invalid payload'], 400);
        } catch (SignatureVerificationException $e) {
            return response()->json(['error' => 'Invalid signature'], 400);
        }

        if ($event->type === 'checkout.session.completed') {
            $session = $event->data->object;
            $orderId = $session->metadata->order_id ?? null;
            $order = $orderId ? Order::find($orderId) : null;

            if ($order) {
                $order->update([
                    'status' => 'completed',
                    'payment_status' => PaymentStatus::Paid,
                ]);

                PaymentTransaction::create([
                    'order_id' => $order->id,
                    'driver' => 'stripe',
                    'type' => TransactionType::Capture,
                    'status' => TransactionStatus::Success,
                    'amount' => $session->amount_total ?? 0,
                    'currency_code' => strtoupper($session->currency ?? $order->currency_code),
                    'reference' => $session->payment_intent,
                ]);
            }
        }

        return response()->json(['status' => 'success']);
    }
}
