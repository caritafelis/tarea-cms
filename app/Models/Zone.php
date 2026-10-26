<?php

namespace App\Models;

use App\Concerns\HasSlug;
use Carbon\CarbonInterface;
use Database\Factories\ZoneFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphToMany;

/**
 * @property-read int $id
 * @property-read string $name
 * @property-read string $slug
 * @property-read ?string $code
 * @property-read bool $is_enabled
 * @property-read ?int $currency_id
 * @property-read array<string, mixed>|null $metadata
 * @property-read CarbonInterface $created_at
 * @property-read CarbonInterface $updated_at
 * @property-read string $carriers_name
 * @property-read string $countries_name
 * @property-read string $payments_name
 * @property-read string $currency_code
 * @property-read Currency $currency
 * @property-read EloquentCollection<int, Carrier> $carriers
 * @property-read EloquentCollection<int, CarrierOption> $shippingOptions
 * @property-read EloquentCollection<int, PaymentMethod> $paymentMethods
 * @property-read EloquentCollection<int, Country> $countries
 * @property-read EloquentCollection<int, Collection> $collections
 */
class Zone extends Model
{
    /** @use HasFactory<ZoneFactory> */
    use HasFactory;

    use HasSlug;

    protected $guarded = [];

    public function isEnabled(): bool
    {
        return $this->is_enabled;
    }

    public function countriesName(): Attribute
    {
        $countries = $this->countries->pluck('translated_name')->toArray();

        return Attribute::make(
            get: fn (): string => count($countries)
            ? implode(', ', array_map(fn (string $item): string => ucwords($item), $countries))
            : 'N/A'
        );
    }

    public function carriersName(): Attribute
    {
        $carriers = $this->carriers->pluck('name')->toArray();

        return Attribute::make(
            get: fn (): string => count($carriers)
            ? implode(', ', array_map(fn (string $item): string => ucwords($item), $carriers))
            : 'N/A'
        );
    }

    public function paymentsName(): Attribute
    {
        $paymentsMethods = $this->paymentMethods->pluck('title')->toArray();

        return Attribute::make(
            get: fn (): string => count($paymentsMethods)
            ? implode(', ', array_map(fn (string $item): string => ucwords($item), $paymentsMethods))
            : 'N/A'
        );
    }

    public function currencyCode(): Attribute
    {
        return Attribute::get(fn (): string => $this->loadMissing('currency')->currency->code);
    }

    /**
     * @param  Builder<Zone>  $query
     * @return Builder<Zone>
     */
    public function scopeEnabled(Builder $query): Builder
    {
        return $query->where('is_enabled', true);
    }

    /**
     * @return BelongsTo<Currency, $this>
     */
    public function currency(): BelongsTo
    {
        return $this->belongsTo(Currency::class, 'currency_id');
    }

    /**
     * @return MorphToMany<Country, $this>
     */
    public function countries(): MorphToMany
    {
        return $this->morphedByMany(Country::class, 'zonable', 'zone_has_relations');
    }

    /**
     * @return MorphToMany<PaymentMethod, $this>
     */
    public function paymentMethods(): MorphToMany
    {
        return $this->morphedByMany(PaymentMethod::class, 'zonable', 'zone_has_relations');
    }

    /**
     * @return MorphToMany<Carrier, $this>
     */
    public function carriers(): MorphToMany
    {
        return $this->morphedByMany(Carrier::class, 'zonable', 'zone_has_relations');
    }

    /**
     * @return MorphToMany<Collection, $this>
     */
    public function collections(): MorphToMany
    {
        return $this->morphedByMany(Collection::class, 'zonable', 'zone_has_relations');
    }

    /**
     * @return HasMany<CarrierOption, $this>
     */
    public function shippingOptions(): HasMany
    {
        return $this->hasMany(CarrierOption::class);
    }

    protected static function newFactory(): ZoneFactory
    {
        return ZoneFactory::new();
    }

    protected function casts(): array
    {
        return [
            'is_enabled' => 'boolean',
            'metadata' => 'array',
        ];
    }
}
