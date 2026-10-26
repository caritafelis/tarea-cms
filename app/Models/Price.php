<?php

namespace App\Models;

use App\Helpers\Price as PriceHelper;
use Database\Factories\PriceFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Price extends Model
{
    /** @use HasFactory<PriceFactory> */
    use HasFactory;

    protected $guarded = [];

    protected function casts(): array
    {
        return ['sale_starts_at' => 'datetime', 'sale_ends_at' => 'datetime'];
    }

    public function isOnSale(): bool
    {
        if ($this->sale_amount === null || (int) $this->sale_amount >= (int) $this->amount) {
            return false;
        }

        $now = now();

        return ($this->sale_starts_at === null || $this->sale_starts_at <= $now)
            && ($this->sale_ends_at === null || $this->sale_ends_at >= $now);
    }

    /** Lo que el cliente realmente paga ahora mismo. */
    public function effectiveAmount(): int
    {
        return $this->isOnSale() ? (int) $this->sale_amount : (int) $this->amount;
    }

    public function currencyCode(): Attribute
    {
        return Attribute::get(fn (): string => $this->loadMissing('currency')->currency->code);
    }

    public function amountPrice(): ?PriceHelper
    {
        if (! $this->amount) {
            return null;
        }

        return PriceHelper::from($this->amount);
    }

    public function compareAmountPrice(): ?PriceHelper
    {
        if (! $this->compare_amount) {
            return null;
        }

        return PriceHelper::from($this->compare_amount);
    }

    public function costAmountPrice(): ?PriceHelper
    {
        if (! $this->cost_amount) {
            return null;
        }

        return PriceHelper::from($this->cost_amount);
    }

    /**
     * @return BelongsTo<Currency, $this>
     */
    public function currency(): BelongsTo
    {
        return $this->belongsTo(Currency::class, 'currency_id');
    }

    /**
     * @return MorphTo<Model, $this>
     */
    public function priceable(): MorphTo
    {
        return $this->morphTo();
    }

    protected static function newFactory(): PriceFactory
    {
        return PriceFactory::new();
    }
}
