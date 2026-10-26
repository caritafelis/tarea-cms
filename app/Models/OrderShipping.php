<?php

namespace App\Models;

use App\Concerns\Core\HasFulfillmentTransitions;
use App\Enums\ShipmentStatus;
use Database\Factories\OrderShippingFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class OrderShipping extends Model
{
    /** @use HasFactory<OrderShippingFactory> */
    use HasFactory;

    use HasFulfillmentTransitions;

    protected $guarded = [];

    /**
     * @return BelongsTo<Order, $this>
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    /**
     * @return BelongsTo<Carrier, $this>
     */
    public function carrier(): BelongsTo
    {
        return $this->belongsTo(Carrier::class, 'carrier_id');
    }

    /**
     * @return HasMany<OrderItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class, 'order_shipping_id');
    }

    /**
     * @return HasMany<OrderShippingEvent, $this>
     */
    public function events(): HasMany
    {
        return $this->hasMany(OrderShippingEvent::class, 'order_shipping_id');
    }

    /**
     * @return MorphMany<OrderTaxLine, $this>
     */
    public function taxLines(): MorphMany
    {
        return $this->morphMany(OrderTaxLine::class, 'taxable');
    }

    protected static function newFactory(): OrderShippingFactory
    {
        return OrderShippingFactory::new();
    }

    protected function casts(): array
    {
        return [
            'status' => ShipmentStatus::class,
            'shipped_at' => 'datetime',
            'received_at' => 'datetime',
            'returned_at' => 'datetime',
            'voucher' => 'json',
        ];
    }
}
