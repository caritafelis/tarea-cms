<?php

namespace App\Models;

use Database\Factories\AttributeProductFactory;
use Illuminate\Database\Eloquent\Casts\Attribute as LaravelAttribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttributeProduct extends Model
{
    /** @use HasFactory<AttributeProductFactory> */
    use HasFactory;

    public $timestamps = false;

    protected $guarded = [];

    /**
     * @return BelongsTo<Attribute, $this>
     */
    public function attribute(): BelongsTo
    {
        return $this->belongsTo(Attribute::class, 'attribute_id');
    }

    /**
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    /**
     * @return BelongsTo<AttributeValue, $this>
     */
    public function value(): BelongsTo
    {
        return $this->belongsTo(AttributeValue::class, 'attribute_value_id');
    }

    protected static function newFactory(): AttributeProductFactory
    {
        return AttributeProductFactory::new();
    }

    protected function realValue(): LaravelAttribute
    {
        return LaravelAttribute::get(fn (): string => $this->attribute_custom_value ?? $this->value?->value);
    }
}
