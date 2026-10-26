<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property int|null $subscription_id
 * @property string $gateway
 * @property string $gateway_invoice_id
 * @property string $number
 * @property int $amount_cents
 * @property string $currency
 * @property string $status "paid" | "open" | "void" | "uncollectible"
 * @property Carbon|null $paid_at
 * @property string|null $pdf_url
 */
class Invoice extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'paid_at' => 'datetime',
            'amount_cents' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }

    public function formattedAmount(): string
    {
        $amount = number_format($this->amount_cents / 100, 2);

        return match ($this->currency) {
            'usd' => "\${$amount}",
            'eur' => "€{$amount}",
            default => strtoupper($this->currency)." {$amount}",
        };
    }
}
