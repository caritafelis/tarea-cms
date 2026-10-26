<?php

namespace App\Http\Controllers\Webhooks;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Services\Billing\PaymentGatewayManager;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class NuveiWebhookController extends Controller
{
    public function __invoke(Request $request, PaymentGatewayManager $gateways): Response
    {
        $payload = $request->json()->all();

        // Token inválido: Nuvei espera 203 (y 200 cuando todo está bien).
        if (! $gateways->driver('nuvei')->verifyWebhookToken($payload)) {
            Log::warning('Nuvei webhook rejected: invalid stoken.');

            return response('Invalid token', 203);
        }

        $tx = $payload['transaction'] ?? [];
        $id = (string) ($tx['id'] ?? '');
        $detail = (int) ($tx['status_detail'] ?? -1);

        $status = match (true) {
            $detail === 3 => 'paid',
            in_array($detail, [7, 34], true) => 'refunded',
            $detail === 8 => 'chargeback',
            in_array($detail, [0, 1, 31, 32, 35, 36], true) => 'open',
            default => 'failed',
        };

        $invoice = $id !== ''
            ? Invoice::where('gateway', 'nuvei')->where('gateway_invoice_id', $id)->first()
            : null;

        if ($invoice) {
            $invoice->update([
                'status' => $status,
                'paid_at' => $status === 'paid' ? ($invoice->paid_at ?? now()) : $invoice->paid_at,
            ]);
        } else {
            Log::info('Nuvei webhook for unknown transaction.', ['id' => $id, 'status_detail' => $detail]);
        }

        return response('OK', 200);
    }
}