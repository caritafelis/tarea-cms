<?php

namespace App\Enums;

use App\Concerns\Core\ArrayableEnum;
use App\Concerns\Core\HasEnumStaticMethods;
use App\Concerns\HasLabel;

/**
 * @method static string None()
 * @method static string Price()
 * @method static string Quantity()
 */
enum DiscountRequirement: string implements HasLabel
{
    use ArrayableEnum;
    use HasEnumStaticMethods;

    case None = 'none';

    case Price = 'price';

    case Quantity = 'quantity';

    public function getLabel(): string
    {
        return match ($this) {
            self::None => __('shopper-core::enum/discount.requirement.none'),
            self::Price => __('shopper-core::enum/discount.requirement.min_amount'),
            self::Quantity => __('shopper-core::enum/discount.requirement.min_quantity'),
        };
    }
}
