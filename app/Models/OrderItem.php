<?php

namespace App\Models;

use App\Enums\FulfillmentStatus;
use Database\Factories\OrderItemFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class OrderItem extends Model
{
    /** @use HasFactory<OrderItemFactory> */
    use HasFactory;

    protected $guarded = [];

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function __construct(array $attributes = [])
    {
        if (! isset($attributes['fulfillment_status'])) {
            $this->setRawAttributes(
                array_merge($this->attributes, [
                    'fulfillment_status' => FulfillmentStatus::Pending,
                ]),
                true
            );
        }

        parent::__construct($attributes);
    }

    /**
     * @return MorphTo<Model, $this>
     */
    public function product(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * @return BelongsTo<Order, $this>
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    /**
     * @return MorphMany<OrderTaxLine, $this>
     */
    public function taxLines(): MorphMany
    {
        return $this->morphMany(OrderTaxLine::class, 'taxable');
    }

    /**
     * @return BelongsTo<OrderShipping, $this>
     */
    public function shipment(): BelongsTo
    {
        return $this->belongsTo(OrderShipping::class, 'order_shipping_id');
    }

    protected static function newFactory(): OrderItemFactory
    {
        return OrderItemFactory::new();
    }

    protected function casts(): array
    {
        return [
            'fulfillment_status' => FulfillmentStatus::class,
        ];
    }

    protected function purchaseNote(): Attribute
    {
        return Attribute::get(function (): ?string {
            if (! $this->orderIsPaid()) {
                return null;
            }
            $model = $this->product;
            $product = $model instanceof ProductVariant ? $model->product : $model;

            return $product instanceof Product ? $product->purchase_note : null;
        });
    }

    protected function downloads(): Attribute
    {
        return Attribute::get(function (): array {
            if (! $this->orderIsPaid()) {
                return [];
            }

            return DownloadGrant::with('media')->where('order_item_id', $this->id)->get()->map(fn (DownloadGrant $g): array => [
                'name' => $g->media->file_name,
                'url' => route('downloads.show', $g->token),
                'remaining' => $g->remaining(),
                'expires_at' => $g->expires_at?->toIso8601String(),
            ])->all();
        });
    }

    private function orderIsPaid(): bool
    {
        $status = $this->order?->payment_status;

        return ($status instanceof \BackedEnum ? $status->value : $status) === 'paid';
    }

    protected function total(): Attribute
    {
        return Attribute::make(
            get: fn (): int => ($this->unit_price_amount * $this->quantity) - $this->discount_amount
        );
    }
}
