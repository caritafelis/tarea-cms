<?php

namespace App\Contracts;

use App\Models\Price;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphMany;

/**
 * @template TModel of Model
 *
 * @property-read Collection<int, Price> $prices
 */
interface Priceable
{
    public function getPrice(?string $currencyCode = null): ?Price;

    /**
     * @return MorphMany<Price, TModel>
     */
    public function prices(): MorphMany;
}
