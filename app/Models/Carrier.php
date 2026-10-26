<?php

namespace App\Models;

use App\Concerns\Core\HasZones;
use App\Concerns\HasSlug;
use Database\Factories\CarrierFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Carrier extends Model
{
    /** @use HasFactory<CarrierFactory> */
    use HasFactory;

    use HasSlug;
    use HasZones;

    protected $guarded = [];

    /**
     * @param  Builder<Carrier>  $query
     * @return Builder<Carrier>
     */
    public function scopeEnabled(Builder $query): Builder
    {
        return $query->where('is_enabled', true);
    }

    /**
     * @return HasMany<CarrierOption, $this>
     */
    public function options(): HasMany
    {
        return $this->hasMany(CarrierOption::class);
    }

    public function logo(): ?string
    {
        if (! app()->bound('shopper.carrier.logo')) {
            return null;
        }

        /** @var callable(static): ?string $resolver */
        $resolver = app('shopper.carrier.logo');

        return $resolver($this);
    }

    protected static function newFactory(): CarrierFactory
    {
        return CarrierFactory::new();
    }

    protected function casts(): array
    {
        return [
            'is_enabled' => 'boolean',
            'metadata' => 'array',
        ];
    }
}
