<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * Modelo propio (no el de Cashier) para poder soportar varios gateways
 * de pago sobre las mismas columnas "stripe_*" que ya tienes migradas.
 * Esas columnas se siguen llamando "stripe_*" por compatibilidad con
 * la migración original, pero se usan igual para PayPal y Nuvei;
 * la columna "gateway" es la que dice a cuál pertenece cada fila.
 *
 * @property int $id
 * @property int $user_id
 * @property string $type
 * @property string $gateway "stripe" | "paypal" | "nuvei"
 * @property string $stripe_id id de la suscripción en el gateway
 * @property string $stripe_status "active" | "canceled" | "past_due" | "trialing" | ...
 * @property string|null $stripe_price
 * @property int|null $quantity
 * @property bool $auto_renew
 * @property Carbon|null $trial_ends_at
 * @property Carbon|null $ends_at
 */
class Subscription extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'renews_at' => 'datetime',
            'trial_ends_at' => 'datetime',
            'ends_at' => 'datetime',
            'auto_renew' => 'boolean',
            'quantity' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class, 'plan_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(SubscriptionItem::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function active(): bool
    {
        return in_array($this->stripe_status, ['active', 'trialing'], true)
            && (! $this->ends_at || $this->ends_at->isFuture());
    }

    public function canceled(): bool
    {
        return $this->stripe_status === 'canceled'
            || ($this->ends_at && $this->ends_at->isPast());
    }

    public function onGracePeriod(): bool
    {
        return $this->ends_at && $this->ends_at->isFuture() && ! $this->auto_renew;
    }
}
