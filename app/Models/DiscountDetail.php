<?php

namespace App\Models;

use App\Enums\DiscountCondition;
use Carbon\CarbonInterface;
use Database\Factories\DiscountDetailFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * @property-read int $id
 * @property-read DiscountCondition $condition
 * @property-read string $discountable_type
 * @property-read int $discountable_id
 * @property-read int $discount_id
 * @property-read int $total_use
 * @property-read Discount $discount
 * @property-read Model $discountable
 * @property-read CarbonInterface $created_at
 * @property-read CarbonInterface $updated_at
 */
class DiscountDetail extends Model
{
    /** @use HasFactory<DiscountDetailFactory> */
    use HasFactory;

    protected $guarded = [];

    /**
     * @return BelongsTo<Discount, $this>
     */
    public function discount(): BelongsTo
    {
        return $this->belongsTo(Discount::class, 'discount_id');
    }

    /**
     * @return MorphTo<Model, $this>
     */
    public function discountable(): MorphTo
    {
        return $this->morphTo();
    }

    protected static function newFactory(): DiscountDetailFactory
    {
        return DiscountDetailFactory::new();
    }

    protected function casts(): array
    {
        return [
            'condition' => DiscountCondition::class,
        ];
    }
}
