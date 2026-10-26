<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Database\Factories\TaxRateFactory;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property-read int $id
 * @property-read string $name
 * @property-read ?string $code
 * @property-read float $rate
 * @property-read bool $is_default
 * @property-read bool $is_combinable
 * @property-read int $tax_zone_id
 * @property-read array<string, mixed>|null $metadata
 * @property-read CarbonInterface $created_at
 * @property-read CarbonInterface $updated_at
 * @property-read TaxZone $taxZone
 * @property-read EloquentCollection<int, TaxRateRule> $rules
 */
class TaxRate extends Model
{
    /** @use HasFactory<TaxRateFactory> */
    use HasFactory;

    protected $guarded = [];

    /**
     * @return BelongsTo<TaxZone, $this>
     */
    public function taxZone(): BelongsTo
    {
        return $this->belongsTo(TaxZone::class, 'tax_zone_id');
    }

    /**
     * @return HasMany<TaxRateRule, $this>
     */
    public function rules(): HasMany
    {
        return $this->hasMany(TaxRateRule::class, 'tax_rate_id');
    }

    protected static function newFactory(): TaxRateFactory
    {
        return TaxRateFactory::new();
    }

    protected function casts(): array
    {
        return [
            'rate' => 'float',
            'is_default' => 'boolean',
            'is_combinable' => 'boolean',
            'metadata' => 'array',
        ];
    }
}
