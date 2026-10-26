<?php

namespace App\Models;

use App\Concerns\HasDimensions;
use App\Concerns\HasExternalIds;
use App\Concerns\HasPrices;
use App\Concerns\HasStock;
use App\Contracts\Priceable;
use App\Contracts\Stockable;
use App\Enums\Dimension\Length;
use App\Enums\Dimension\Volume;
use App\Enums\Dimension\Weight;
use App\Support\Barcode;
use Carbon\CarbonInterface;
use Database\Factories\ProductVariantFactory;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Spatie\MediaLibrary\HasMedia as SpatieHasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

/**
 * @property-read int $id
 * @property-read string $name
 * @property-read ?string $sku
 * @property-read ?string $barcode
 * @property-read ?string $ean
 * @property-read ?string $upc
 * @property-read Weight $weight_unit
 * @property-read ?float $weight_value
 * @property-read Length $height_unit
 * @property-read ?float $height_value
 * @property-read Length $width_unit
 * @property-read ?float $width_value
 * @property-read Length $depth_unit
 * @property-read ?float $depth_value
 * @property-read Volume $volume_unit
 * @property-read ?float $volume_value
 * @property-read bool $allow_backorder
 * @property-read int $position
 * @property-read int $product_id
 * @property-read array<string, mixed>|null $metadata
 * @property-read CarbonInterface $created_at
 * @property-read CarbonInterface $updated_at
 * @property-read int $stock
 * @property-read Product $product
 * @property-read Collection<int, AttributeValue> $values
 *
 * @implements Priceable<ProductVariant>
 */
class ProductVariant extends Model implements Priceable, SpatieHasMedia, Stockable
{
    use HasDimensions;

    /** @use HasFactory<ProductVariantFactory> */
    use HasFactory;
    use HasExternalIds;
    use HasPrices;
    use HasStock;
    use InteractsWithMedia;

    protected $guarded = [];
    
    protected $table = 'product_variants';

    protected function casts(): array
    {
        return [
            'allow_backorder' => 'boolean',
            'metadata' => 'array',
            'position' => 'integer',
            'weight_unit' => Weight::class,
            'weight_value' => 'decimal:2',
            'width_unit' => Length::class,
            'width_value' => 'decimal:2',
            'height_unit' => Length::class,
            'height_value' => 'decimal:2',
            'depth_unit' => Length::class,
            'depth_value' => 'decimal:2',
            'volume_unit' => Volume::class,
            'volume_value' => 'decimal:2',
        ];
    }

    protected static function booted(): void
    {
        static::created(function (self $variant): void {
            if (blank($variant->barcode)) {
                $variant->forceFill(['barcode' => Barcode::forVariant($variant->id)])->saveQuietly();
            }
        });
    }

    public function tracksInventory(): bool
    {
        return true;
    }

    /**
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    /**
     * @return BelongsToMany<AttributeValue, $this>
     */
    public function values(): BelongsToMany
    {
        return $this->belongsToMany(
            AttributeValue::class,
            'attribute_value_product_variant',
            'variant_id',
            'value_id'
        );
    }

    protected static function newFactory(): ProductVariantFactory
    {
        return ProductVariantFactory::new();
    }
}
