<?php

namespace App\Models;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\ShippingStatus;
use App\Models\Payment\PaymentTransaction;
use App\Models\User as ShopperUser;
use Database\Factories\OrderFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Order extends Model
{
    /** @use HasFactory<OrderFactory> */
    use HasFactory;

    use SoftDeletes;

    protected $guarded = [];

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function __construct(array $attributes = [])
    {
        if (! isset($attributes['status'])) {
            $this->setDefaultOrderStatus();
        }

        parent::__construct($attributes);
    }

    public function setDefaultOrderStatus(): void
    {
        $this->setRawAttributes(
            array_merge(
                $this->attributes,
                [
                    'status' => OrderStatus::New,
                    'payment_status' => PaymentStatus::Pending,
                    'shipping_status' => ShippingStatus::Unfulfilled,
                ]
            ),
            true
        );
    }

    public function total(): float|int
    {
        return $this->items->sum('total');
    }

    public function canBeCancelled(): bool
    {
        return ! in_array($this->status, [
            OrderStatus::Cancelled,
            OrderStatus::Archived,
        ], true)
            && ! in_array($this->shipping_status, [
                ShippingStatus::Delivered,
                ShippingStatus::PartiallyDelivered,
                ShippingStatus::Returned,
                ShippingStatus::PartiallyReturned,
            ], true);
    }

    public function isNotCancelled(): bool
    {
        return $this->status !== OrderStatus::Cancelled;
    }

    public function isNew(): bool
    {
        return $this->status === OrderStatus::New;
    }

    public function isProcessing(): bool
    {
        return $this->status === OrderStatus::Processing;
    }

    public function isCompleted(): bool
    {
        return $this->status === OrderStatus::Completed;
    }

    public function isArchived(): bool
    {
        return $this->status === OrderStatus::Archived;
    }

    public function isPaid(): bool
    {
        return $this->payment_status === PaymentStatus::Paid;
    }

    public function isPaymentPending(): bool
    {
        return $this->payment_status === PaymentStatus::Pending;
    }

    public function isPaymentAuthorized(): bool
    {
        return $this->payment_status === PaymentStatus::Authorized;
    }

    public function isRefunded(): bool
    {
        return $this->payment_status === PaymentStatus::Refunded;
    }

    public function isShipped(): bool
    {
        return $this->shipping_status === ShippingStatus::Shipped;
    }

    public function isShippingPending(): bool
    {
        return $this->shipping_status === ShippingStatus::Unfulfilled;
    }

    /**
     * @return BelongsTo<OrderAddress, $this>
     */
    public function shippingAddress(): BelongsTo
    {
        return $this->belongsTo(OrderAddress::class, 'shipping_address_id');
    }

    /**
     * @return BelongsTo<OrderAddress, $this>
     */
    public function billingAddress(): BelongsTo
    {
        return $this->belongsTo(OrderAddress::class, 'billing_address_id');
    }

    /**
     * @return BelongsTo<Model&ShopperUser, $this>
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(ShopperUser::class, 'customer_id');
    }

    /**
     * @return BelongsTo<Channel, $this>
     */
    public function channel(): BelongsTo
    {
        return $this->belongsTo(Channel::class, 'channel_id');
    }

    /**
     * @return BelongsTo<PaymentMethod, $this>
     */
    public function paymentMethod(): BelongsTo
    {
        return $this->belongsTo(PaymentMethod::class, 'payment_method_id');
    }

    /**
     * @return HasMany<OrderShipping, $this>
     */
    public function shipments(): HasMany
    {
        return $this->hasMany(OrderShipping::class, 'order_id');
    }

    /**
     * @return MorphMany<OrderTaxLine, $this>
     */
    public function taxLines(): MorphMany
    {
        return $this->morphMany(OrderTaxLine::class, 'taxable');
    }

    /**
     * @return BelongsTo<static, $this>
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(static::class, 'parent_order_id');
    }

    /**
     * @return HasMany<static, $this>
     */
    public function children(): HasMany
    {
        return $this->hasMany(static::class, 'parent_order_id');
    }

    /**
     * @return BelongsTo<Zone, $this>
     */
    public function zone(): BelongsTo
    {
        return $this->belongsTo(Zone::class, 'zone_id');
    }

    /**
     * @return HasMany<PaymentTransaction, $this>
     */
    public function transactions(): HasMany
    {
        return $this->hasMany(PaymentTransaction::class);
    }

    /**
     * @return HasOne<OrderRefund, $this>
     */
    public function refund(): HasOne
    {
        return $this->hasOne(OrderRefund::class);
    }

    /**
     * @return HasMany<OrderItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * @return HasMany<OrderShipping, $this>
     */
    public function shippings(): HasMany
    {
        return $this->hasMany(OrderShipping::class);
    }

    /**
     * @return BelongsTo<CarrierOption, $this>
     */
    public function shippingOption(): BelongsTo
    {
        return $this->belongsTo(CarrierOption::class, 'shipping_option_id');
    }

    /**
     * @param  Builder<Order>  $query
     * @return Builder<Order>
     */
    public function scopeArchived(Builder $query): Builder
    {
        return $query->where('status', OrderStatus::Archived);
    }

    /**
     * @param  Builder<Order>  $query
     * @return Builder<Order>
     */
    public function scopeNotArchived(Builder $query): Builder
    {
        return $query->where('status', '!=', OrderStatus::Archived);
    }

    protected static function newFactory(): OrderFactory
    {
        return OrderFactory::new();
    }

    protected function casts(): array
    {
        return [
            'status' => OrderStatus::class,
            'payment_status' => PaymentStatus::class,
            'shipping_status' => ShippingStatus::class,
            'cancelled_at' => 'datetime',
            'archived_at' => 'datetime',
        ];
    }
}
