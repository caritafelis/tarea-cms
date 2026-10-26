<?php

namespace App\Concerns;

use App\Models\Discount;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Relations\MorphToMany;

/**
 * @property-read Collection<int, Discount> $discounts
 */
trait HasDiscounts
{
    /**
     * @return MorphToMany<Discount, $this>
     */
    public function discounts(): MorphToMany
    {
        return $this->morphToMany(
            Discount::class,
            'discountable',
            shopper_table('discountables'),
            'discountable_id',
            'discount_id'
        );
    }
}
