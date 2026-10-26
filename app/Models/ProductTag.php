<?php

namespace App\Models;

use App\Concerns\HasSlug;
use Carbon\CarbonInterface;
use Database\Factories\ProductTagFactory;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphToMany;

/**
 * @property-read int $id
 * @property-read string $name
 * @property-read ?string $slug
 * @property-read CarbonInterface $created_at
 * @property-read CarbonInterface $updated_at
 * @property-read Collection<int, Product> $products
 */
class ProductTag extends Model
{
    /** @use HasFactory<ProductTagFactory> */
    use HasFactory;

    use HasSlug;

    protected $guarded = [];

    /**
     * @return MorphToMany<Product, $this>
     */
    public function products(): MorphToMany
    {
        return $this->morphToMany(Product::class, 'productable', 'product_has_relations');
    }

    protected static function newFactory(): ProductTagFactory
    {
        return ProductTagFactory::new();
    }
}
