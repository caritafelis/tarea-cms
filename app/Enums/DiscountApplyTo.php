<?php

namespace App\Enums;

use App\Concerns\Core\ArrayableEnum;
use App\Concerns\Core\HasEnumStaticMethods;
use App\Concerns\HasLabel;

/**
 * @method static string Order()
 * @method static string Products()
 */
enum DiscountApplyTo: string implements HasLabel
{
    use ArrayableEnum;
    use HasEnumStaticMethods;

    case Order = 'order';

    case Products = 'products';

    public function getLabel(): string
    {
        return match ($this) {
            self::Order => __('shopper-core::enum/discount.apply.entire_order'),
            self::Products => __('shopper-core::enum/discount.apply.specific_products'),
        };
    }
}
