<?php

namespace App\Models;

use App\Concerns\HasSlug;
use App\Enums\CollectionType;
use App\Queries\CollectionProductsQuery;
use Database\Factories\CollectionFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphToMany;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Collection extends Model implements HasMedia
{
    /** @use HasFactory<CollectionFactory> */
    use HasFactory;

    use HasSlug;
    use InteractsWithMedia;

    protected $guarded = [];

    public function isAutomatic(): bool
    {
        return $this->type === CollectionType::Auto;
    }

    public function isManual(): bool
    {
        return ! $this->isAutomatic();
    }

    /**
     * Get all products for this collection.
     * For manual collections, returns the attached products.
     * For automatic collections, evaluates rules and returns matching products.
     *
     * @return EloquentCollection<int, Product>
     */
    public function getProducts(): EloquentCollection
    {
        return (new CollectionProductsQuery)->get($this);
    }

    /**
     * Get the query builder for this collection's products.
     * Useful for pagination or further filtering.
     *
     * @return Builder<Product>
     */
    public function productsQuery(): Builder
    {
        return (new CollectionProductsQuery)->query($this);
    }

    public function firstRule(): ?string
    {
        /** @var CollectionRule $collectionRule */
        $collectionRule = $this->rules->first();

        if ($this->isAutomatic()) {
            $words = $collectionRule->getFormattedRule().' '.$collectionRule->getFormattedOperator().' '.$collectionRule->getFormattedValue();
            $rules = $this->rules()->count();

            return $words.' '.($rules >= 2 ? '+ '.($rules - 1).__('words.other') : ''); // @phpstan-ignore-line
        }

        return null;
    }

    /**
     * @param  Builder<static>  $query
     * @return Builder<static>
     */
    public function scopeManual(Builder $query): Builder
    {
        return $query->where('type', CollectionType::Manual);
    }

    /**
     * @param  Builder<static>  $query
     * @return Builder<static>
     */
    public function scopeAutomatic(Builder $query): Builder
    {
        return $query->where('type', CollectionType::Auto);
    }

    /**
     * @param  Builder<static>  $query
     * @return Builder<static>
     */
    public function scopePublished(Builder $query): Builder
    {
        return $query->whereNotNull('published_at')
            ->where('published_at', '<=', now());
    }

    /**
     * @return MorphToMany<Product, $this>
     */
    public function products(): MorphToMany
    {
        return $this->morphToMany(Product::class, 'productable', 'product_has_relations');
    }

    /**
     * @return MorphToMany<Zone, $this>
     */
    public function zones(): MorphToMany
    {
        return $this->morphToMany(Zone::class, 'zonable', 'zone_has_relations');
    }

    /**
     * @return HasMany<CollectionRule, $this>
     */
    public function rules(): HasMany
    {
        return $this->hasMany(CollectionRule::class, 'collection_id');
    }

    protected static function newFactory(): CollectionFactory
    {
        return CollectionFactory::new();
    }

    protected function casts(): array
    {
        return [
            'published_at' => 'datetime',
            'metadata' => 'array',
            'type' => CollectionType::class,
        ];
    }
}
