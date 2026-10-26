<?php

namespace App\Models;

use App\Enums\DiscountStatus;
use App\Enums\DiscountType;
use Carbon\CarbonInterface;
use Database\Factories\DiscountFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property-read int $id
 * @property-read string $code
 * @property-read DiscountType $type
 * @property-read int $value
 * @property-read string $apply_to
 * @property-read string $min_required
 * @property-read ?string $min_required_value
 * @property-read string $eligibility
 * @property-read int $total_use
 * @property-read ?int $usage_limit
 * @property-read bool $usage_limit_per_user
 * @property-read bool $is_active
 * @property-read DiscountStatus $status
 * @property-read ?int $zone_id
 * @property-read array<string, mixed>|null $metadata
 * @property-read CarbonInterface $created_at
 * @property-read CarbonInterface $updated_at
 * @property-read CarbonInterface $start_at
 * @property-read ?CarbonInterface $end_at
 * @property-read ?Zone $zone
 * @property-read Collection<array-key, DiscountDetail> $items
 */
class Discount extends Model
{
    /** @use HasFactory<DiscountFactory> */
    use HasFactory;

    protected $guarded = [];

    public function hasReachedLimit(): bool
    {
        if ($this->usage_limit !== null) {
            return $this->total_use >= $this->usage_limit;
        }

        return false;
    }

    /**
     * @return HasMany<DiscountDetail, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(DiscountDetail::class, 'discount_id');
    }

    /**
     * @return BelongsTo<Zone, $this>
     */
    public function zone(): BelongsTo
    {
        return $this->belongsTo(Zone::class, 'zone_id');
    }

    protected static function newFactory(): DiscountFactory
    {
        return DiscountFactory::new();
    }

    /**
     * @return Attribute<DiscountStatus, never>
     */
    protected function status(): Attribute
    {
        return Attribute::get(function (): DiscountStatus {
            if (! $this->exists) {
                return DiscountStatus::Draft;
            }

            if (! $this->is_active) {
                return DiscountStatus::Disabled;
            }

            if ($this->end_at !== null && $this->end_at->isPast()) {
                return DiscountStatus::Expired;
            }

            if ($this->hasReachedLimit()) {
                return DiscountStatus::LimitReached;
            }

            if ($this->start_at->isFuture()) {
                return DiscountStatus::Scheduled;
            }

            return DiscountStatus::Active;
        });
    }

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'usage_limit_per_user' => 'boolean',
            'start_at' => 'datetime',
            'end_at' => 'datetime',
            'metadata' => 'array',
            'type' => DiscountType::class,
        ];
    }
}
