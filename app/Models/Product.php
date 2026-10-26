<?php

namespace App\Models;

use App\Concerns\HasDimensions;
use App\Concerns\HasDiscounts;
use App\Concerns\HasDynamicFields;
use App\Concerns\HasExternalIds;
use App\Concerns\HasPrices;
use App\Concerns\HasSlug;
use App\Concerns\HasStock;
use App\Concerns\InteractsWithReviews;
use App\Contracts\HasReviews;
use App\Contracts\Priceable;
use App\Contracts\Stockable;
use App\Data\MediaCollectionConfig;
use App\Enums\Dimension\Length;
use App\Enums\Dimension\Volume;
use App\Enums\Dimension\Weight;
use App\Enums\ProductType;
use App\Support\Barcode;
use Database\Factories\ProductFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute as LaravelAttribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Arr;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Product extends Model implements HasMedia, HasReviews, Priceable, Stockable
{
    use HasDimensions;
    use HasExternalIds;
    use HasDiscounts;
    use HasDynamicFields;
    use HasFactory;
    use HasPrices;
    use HasSlug;
    use HasStock;
    use InteractsWithMedia;
    use InteractsWithReviews;
    use SoftDeletes;
    

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'allow_backorder' => 'boolean',
            'featured' => 'boolean',
            'is_visible' => 'boolean',
            'published_at' => 'datetime',
            'metadata' => 'array',
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
            'type' => ProductType::class,
            'manage_stock' => 'boolean',
            'sold_individually' => 'boolean',
            'shipping_enabled' => 'boolean',
            'shipping_free' => 'boolean',
            'ship_internationally' => 'boolean',
            'shipping_requires_box' => 'boolean',
            'enable_reviews' => 'boolean',
            'min_qty' => 'integer',
            'max_qty' => 'integer',
            'menu_order' => 'integer',
            'download_limit' => 'integer',
            'download_expiry_days' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::created(function (self $product): void {
            if (blank($product->barcode)) {
                $product->forceFill(['barcode' => Barcode::forProduct($product->id)])->saveQuietly();
            }
        });
    }

    public function canUseShipping(): bool
    {
        return $this->isStandard() || $this->isVariant();
    }

    public function canUseAttributes(): bool
    {
        return $this->isStandard() || $this->isVariant() || $this->isVirtual();
    }

    public function canUseVariants(): bool
    {
        return $this->isVariant();
    }

    public function isExternal(): bool
    {
        return $this->type === ProductType::External;
    }

    public function isVariant(): bool
    {
        return $this->type === ProductType::Variant;
    }

    public function isVirtual(): bool
    {
        return $this->type === ProductType::Virtual;
    }

    public function isStandard(): bool
    {
        return $this->type === ProductType::Standard;
    }

    public function tracksInventory(): bool
    {
        return $this->isStandard() || $this->isVariant();
    }

    public function isPublished(): bool
    {
        return $this->is_visible && $this->published_at && $this->published_at <= now();
    }

    /**
     * @param  Builder<Product>  $query
     */
    public function scopePublish(Builder $query): void
    {
        $query->whereDate('published_at', '<=', now())
            ->where('is_visible', true);
    }

    /**
     * @param  Builder<Product>  $query
     * @param  string|array<string>  $channel
     * @return Builder<Product>
     */
    public function scopeForChannel(Builder $query, string|array $channel): Builder
    {
        $channels = Arr::wrap($channel);

        return $query->whereHas('channels', function (Builder $query) use ($channels): void {
            $query->whereIn('id', $channels);
        });
    }

    /** @return array<string, MediaCollectionConfig> */
    public function getMediaCollections(): array
    {
        return array_merge(
            $this->defaultMediaCollections(),
            [
                'files' => new MediaCollectionConfig(
                    name: 'files',
                    disk: config('media-library.disk_name', 'public'),
                    acceptsMimeTypes: [],
                ),
            ]
        );
    }

    /**
     * @return HasMany<ProductVariant, $this>
     */
    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class, 'product_id')->orderBy('position');
    }

    /**
     * @return MorphToMany<Channel, $this>
     */
    public function channels(): MorphToMany
    {
        return $this->morphedByMany(Channel::class, 'productable', 'product_has_relations');
    }

    /**
     * @return MorphToMany<self, $this>
     */
    public function relatedProducts(): MorphToMany
    {
        return $this->morphedByMany(Product::class, 'productable', 'product_has_relations');
    }

    /**
     * @return MorphToMany<Category, $this>
     */
    public function categories(): MorphToMany
    {
        return $this->morphedByMany(Category::class, 'productable', 'product_has_relations');
    }

    /**
     * @return MorphToMany<Collection, $this>
     */
    public function collections(): MorphToMany
    {
        return $this->morphedByMany(Collection::class, 'productable', 'product_has_relations');
    }

    /**
     * @return MorphToMany<ProductTag, $this>
     */
    public function tags(): MorphToMany
    {
        return $this->morphedByMany(ProductTag::class, 'productable', 'product_has_relations');
    }

    /**
     * @return BelongsTo<Supplier, $this>
     */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class, 'supplier_id');
    }

    /**
     * @return BelongsTo<Brand, $this>
     */
    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class, 'brand_id');
    }

    /**
     * Product Attributes relation, to avoid collision with Model $attributes
     *
     * @return BelongsToMany<Attribute, $this>
     */
    public function options(): BelongsToMany
    {
        return $this->belongsToMany(Attribute::class, table: 'attribute_product')
            ->withPivot([
                'attribute_value_id',
                'attribute_custom_value',
            ]);
    }

    protected static function newFactory(): ProductFactory
    {
        return ProductFactory::new();
    }

    protected function variantsStock(): LaravelAttribute
    {
        $stock = 0;

        if ($this->variants->isNotEmpty()) {
            /** @var ProductVariant $variant */
            foreach ($this->variants as $variant) {
                $stock += $variant->stock;
            }
        }

        return LaravelAttribute::get(fn (): int => $stock);
    }

    public function upsells(): BelongsToMany
    {
        return $this->linked('upsell');
    }

    public function crossSells(): BelongsToMany
    {
        return $this->linked('cross_sell');
    }

    private function linked(string $type): BelongsToMany
    {
        return $this->belongsToMany(self::class, 'product_links', 'product_id', 'linked_product_id')
            ->withPivotValue('type', $type)
            ->withPivot('position')
            ->orderByPivot('position');
    }

    public function requiresShipping(): bool
    {
        return $this->canUseShipping() && $this->shipping_enabled;
    }

    /** Precios por moneda, con la oferta ya resuelta (para la API pública). */
    protected function pricing(): Attribute
    {
        return Attribute::get(fn (): array => $this->prices()->with('currency')->get()->map(fn (Price $p): array => [
            'currency' => $p->currency?->code,
            'amount' => (int) $p->amount,
            'sale_amount' => $p->sale_amount,
            'compare_amount' => $p->compare_amount,
            'effective_amount' => $p->effectiveAmount(),
            'on_sale' => $p->isOnSale(),
            'sale_ends_at' => $p->sale_ends_at?->toIso8601String(),
        ])->all());
    }

    /** Solo los datos de SEO públicos de metadata (nunca la nota interna). */
    protected function seo(): Attribute
    {
        return Attribute::get(fn (): array => Arr::only($this->metadata ?? [], [
            'seo_title', 'seo_description', 'seo_keyword', 'seo_noindex', 'gtin', 'mpn', 'product_url', 'button_text',
        ]));
    }
}
