<?php

namespace App\Enums;

use App\Concerns\Core\ArrayableEnum;
use App\Concerns\Core\HasEnumStaticMethods;
use App\Concerns\HasLabel;

/**
 * @method static string Everyone()
 * @method static string Customers()
 */
enum DiscountEligibility: string implements HasLabel
{
    use ArrayableEnum;
    use HasEnumStaticMethods;

    case Everyone = 'everyone';

    case Customers = 'customers';

    public function getLabel(): string
    {
        return match ($this) {
            self::Everyone => __('shopper-core::enum/discount.eligibility.everyone'),
            self::Customers => __('shopper-core::enum/discount.eligibility.specific_customers'),
        };
    }
}
