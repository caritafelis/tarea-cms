<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Tarjeta/cuenta guardada del lado del CLIENTE de la suscripción SaaS
 * (billing de tu propio negocio), distinta de App\Models\PaymentMethod
 * que ya usas para el checkout del ecommerce (COD, transferencia, etc.
 * con is_enabled/slug/zones). No renombres esta a "PaymentMethod" o
 * chocará con esa.
 *
 * @property int $id
 * @property int $user_id
 * @property string $gateway "stripe" | "paypal" | "nuvei"
 * @property string $gateway_payment_method_id
 * @property string $type "card" | "paypal_account" | ...
 * @property string|null $brand "visa" | "mastercard" | ...
 * @property string|null $last_four
 * @property int|null $exp_month
 * @property int|null $exp_year
 * @property bool $is_primary
 */
class SubscriptionPaymentMethod extends Model
{
    protected $table = 'subscription_payment_methods';

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'is_primary' => 'boolean',
            'exp_month' => 'integer',
            'exp_year' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isExpired(): bool
    {
        if (! $this->exp_month || ! $this->exp_year) {
            return false;
        }

        return now()->startOfMonth()->greaterThan(
            now()->setDate($this->exp_year, $this->exp_month, 1)->endOfMonth()
        );
    }

    public function label(): string
    {
        return match ($this->type) {
            'card' => ucfirst($this->brand ?? 'Card').' •••• '.$this->last_four,
            'paypal_account' => 'PayPal',
            default => ucfirst($this->type),
        };
    }
}
