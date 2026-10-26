<?php

namespace App\Actions\Admin\Store;

use App\Enums\DiscountApplyTo;
use App\Enums\DiscountEligibility;
use App\Jobs\AttachedDiscountToCustomers;
use App\Jobs\AttachedDiscountToProducts;
use App\Models\Discount;

final readonly class SaveAndDispatchDiscountAction
{
    /**
     * @param  array<string, mixed>  $values
     * @param  array<int>  $productsIds
     * @param  array<int>  $customersIds
     */
    public function __invoke(
        array $values,
        ?int $discountId = null,
        array $productsIds = [],
        array $customersIds = []
    ): Discount {
        if ($discountId) {
            $discount = Discount::query()->findOrFail($discountId);
            $discount->update($values);
        } else {
            $discount = Discount::query()->create($values);
        }

        $applyTo = data_get($values, 'apply_to');
        $eligibility = data_get($values, 'eligibility');

        AttachedDiscountToProducts::dispatch(
            $applyTo instanceof DiscountApplyTo ? $applyTo : DiscountApplyTo::from($applyTo),
            $productsIds,
            $discount,
        );

        AttachedDiscountToCustomers::dispatch(
            $eligibility instanceof DiscountEligibility ? $eligibility : DiscountEligibility::from($eligibility),
            $customersIds,
            $discount,
        );

        return $discount;
    }
}
