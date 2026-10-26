<?php

namespace App\Models\Cart;

use App\Enums\AddressType;
use App\Models\Channel;
use App\Models\Zone;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Cart extends Model
{
    protected $guarded = [];

    public static function configuredClass(): string
    {
        return config('cart.models.cart', static::class);
    }

    public function getTable(): string
    {
        return shopper_table('carts');
    }

    public function isCompleted(): bool
    {
        return $this->completed_at !== null;
    }

    public function shippingAddress(): ?CartAddress
    {
        return $this->addresses->firstWhere('type', AddressType::Shipping);
    }

    public function billingAddress(): ?CartAddress
    {
        return $this->addresses->firstWhere('type', AddressType::Billing);
    }

    /**
     * @return HasMany<CartLine, $this>
     */
    public function lines(): HasMany
    {
        return $this->hasMany(config('cart.models.cart_line', CartLine::class));
    }

    /**
     * @return HasMany<CartAddress, $this>
     */
    public function addresses(): HasMany
    {
        return $this->hasMany(CartAddress::class);
    }

    /**
     * @return BelongsTo<Model, $this>
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(config('auth.providers.users.model'), 'customer_id');
    }

    /**
     * @return BelongsTo<Channel, $this>
     */
    public function channel(): BelongsTo
    {
        return $this->belongsTo(config('shopper.models.channel'), 'channel_id');
    }

    /**
     * @return BelongsTo<Zone, $this>
     */
    public function zone(): BelongsTo
    {
        return $this->belongsTo(Zone::class);
    }

    protected function casts(): array
    {
        return [
            'completed_at' => 'datetime',
            'metadata' => 'array',
        ];
    }
}
