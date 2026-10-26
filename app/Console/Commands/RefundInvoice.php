<?php

namespace App\Console\Commands;

use App\Models\Invoice;
use App\Services\Billing\PaymentGatewayManager;
use Illuminate\Console\Command;

class RefundInvoice extends Command
{
    protected $signature = 'billing:refund {invoice : ID de la factura (Invoice)} {--amount= : Monto parcial en la moneda de la factura}';

    protected $description = 'Reembolsa (total o parcial) un cobro de Nuvei.';

    public function handle(PaymentGatewayManager $gateways): int
    {
        $invoice = Invoice::findOrFail($this->argument('invoice'));

        if ($invoice->gateway !== 'nuvei') {
            $this->error('Only Nuvei invoices can be refunded with this command.');

            return self::FAILURE;
        }

        if ($invoice->status === 'refunded') {
            $this->error('This invoice is already refunded.');

            return self::FAILURE;
        }

        $amountCents = $this->option('amount') !== null
            ? (int) round(((float) $this->option('amount')) * 100)
            : null;

        if ($amountCents !== null && ($amountCents <= 0 || $amountCents > $invoice->amount_cents)) {
            $this->error('Invalid amount.');

            return self::FAILURE;
        }

        $result = $gateways->driver('nuvei')->refund($invoice->gateway_invoice_id, $amountCents);

        if (! $result['ok']) {
            $this->error('Refund failed: '.($result['message'] ?? 'unknown error'));

            return self::FAILURE;
        }

        if ($amountCents === null || $amountCents === $invoice->amount_cents) {
            $invoice->update(['status' => 'refunded']);
        }

        $this->info('Refund completed.');

        return self::SUCCESS;
    }
}