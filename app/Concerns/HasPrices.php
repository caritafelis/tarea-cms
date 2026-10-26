<?php

namespace App\Concerns;

use App\Models\Price;
use Illuminate\Database\Eloquent\Relations\MorphMany;

trait HasPrices
{
    public function getPrice(?string $currencyCode = null): ?Price
    {
        $currencyCode = $currencyCode ?? shopper_currency();

        if ($this->relationLoaded('prices')) {
            $this->prices->loadMissing('currency');

            return $this->prices
                ->first(fn (Price $price): bool => $price->currency->code === $currencyCode);
        }

        return $this->prices()
            ->with('currency')
            ->whereHas('currency', fn ($query) => $query->withoutGlobalScopes()->where('code', $currencyCode))
            ->first();
    }

    /**
     * @return MorphMany<Price, static>
     */
    public function prices(): MorphMany
    {
        return $this->morphMany(Price::class, 'priceable');
    }
}
