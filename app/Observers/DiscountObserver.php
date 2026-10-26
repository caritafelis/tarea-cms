<?php

namespace App\Observers;

use App\Enums\DiscountType;
use App\Exceptions\InvalidDiscountValueException;
use App\Models\Discount;

class DiscountObserver
{
    public function saving(Discount $discount): void
    {
        if ($discount->value <= 0) {
            throw InvalidDiscountValueException::notPositive($discount->value);
        }

        if ($discount->type === DiscountType::Percentage && $discount->value > 100) {
            throw InvalidDiscountValueException::percentageOutOfRange($discount->value);
        }
    }
}
