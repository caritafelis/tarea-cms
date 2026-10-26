<?php

namespace App\Models;

use App\Enums\ShipmentStatus;
use Database\Factories\OrderShippingEventFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderShippingEvent extends Model
{
    /** @use HasFactory<OrderShippingEventFactory> */
    use HasFactory;

    protected $guarded = [];

    /**
     * @return BelongsTo<OrderShipping, $this>
     */
    public function shipment(): BelongsTo
    {
        return $this->belongsTo(OrderShipping::class, 'order_shipping_id');
    }

    protected static function newFactory(): OrderShippingEventFactory
    {
        return OrderShippingEventFactory::new();
    }

    protected function casts(): array
    {
        return [
            'status' => ShipmentStatus::class,
            'occurred_at' => 'datetime',
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'metadata' => 'json',
        ];
    }
}
