<?php

namespace App\Models\Payment;

use App\Enums\Payment\TransactionStatus;
use App\Enums\Payment\TransactionType;
use App\Models\Order;
use App\Models\PaymentMethod;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property-read int $id
 * @property-read string $driver
 * @property-read TransactionType $type
 * @property-read TransactionStatus $status
 * @property-read int $amount
 * @property-read string $currency_code
 * @property-read ?string $reference
 * @property-read array<string, mixed>|null $data
 * @property-read ?string $notes
 * @property-read array<string, mixed>|null $metadata
 * @property-read ?int $order_id
 * @property-read ?int $payment_method_id
 * @property-read CarbonInterface $created_at
 * @property-read CarbonInterface $updated_at
 * @property-read ?Order $order
 * @property-read ?PaymentMethod $paymentMethod
 */
class PaymentTransaction extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'type' => TransactionType::class,
            'status' => TransactionStatus::class,
            'data' => 'array',
            'metadata' => 'array',
        ];
    }

    public function getTable(): string
    {
        return shopper_table('payment_transactions');
    }

    public function isSuccessful(): bool
    {
        return $this->status === TransactionStatus::Success;
    }

    /**
     * @param  Builder<PaymentTransaction>  $query
     * @return Builder<PaymentTransaction>
     */
    public function scopeSuccessful(Builder $query): Builder
    {
        return $query->where('status', TransactionStatus::Success);
    }

    /**
     * @param  Builder<PaymentTransaction>  $query
     * @return Builder<PaymentTransaction>
     */
    public function scopeForDriver(Builder $query, string $driver): Builder
    {
        return $query->where('driver', $driver);
    }

    /**
     * @param  Builder<PaymentTransaction>  $query
     * @return Builder<PaymentTransaction>
     */
    public function scopeOfType(Builder $query, TransactionType $type): Builder
    {
        return $query->where('type', $type);
    }

    /**
     * @return BelongsTo<Order, $this>
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    /**
     * @return BelongsTo<PaymentMethod, $this>
     */
    public function paymentMethod(): BelongsTo
    {
        return $this->belongsTo(PaymentMethod::class, 'payment_method_id');
    }
}
