<?php

namespace App\Models;

use App\Models\User as ShopperUser;
use Carbon\CarbonInterface;
use Database\Factories\InventoryHistoryFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * @property-read int $id
 * @property-read int $quantity
 * @property-read ?int $old_quantity
 * @property-read ?string $event
 * @property-read ?string $description
 * @property-read int $user_id
 * @property-read int $inventory_id
 * @property-read string|int $adjustment
 * @property-read string $stockable_type
 * @property-read int $stockable_id
 * @property-read string $reference_type
 * @property-read int $reference_id
 * @property-read CarbonInterface $created_at
 * @property-read CarbonInterface $updated_at
 * @property-read Inventory $inventory
 * @property-read Model&ShopperUser $user
 */
class InventoryHistory extends Model
{
    /** @use HasFactory<InventoryHistoryFactory> */
    use HasFactory;

    protected $guarded = [];

    /**
     * @return BelongsTo<Inventory, $this>
     */
    public function inventory(): BelongsTo
    {
        return $this->belongsTo(Inventory::class, 'inventory_id');
    }

    /**
     * @return BelongsTo<Model&ShopperUser, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(ShopperUser::class, 'user_id');
    }

    /**
     * @return MorphTo<Model, $this>
     */
    public function stockable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * @return MorphTo<Model, $this>
     */
    public function reference(): MorphTo
    {
        return $this->morphTo();
    }

    protected static function newFactory(): InventoryHistoryFactory
    {
        return InventoryHistoryFactory::new();
    }

    protected function adjustment(): Attribute
    {
        return Attribute::make(
            get: fn (): string|int => $this->old_quantity > 0
            ? '+'.$this->old_quantity
            : $this->old_quantity
        );
    }
}
