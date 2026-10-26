<?php

namespace App\Enums;

use App\Concerns\Core\ArrayableEnum;
use App\Concerns\Core\HasEnumStaticMethods;
use App\Concerns\HasDescription;
use App\Concerns\HasLabel;

/**
 * @method static string Percentage()
 * @method static string FixedAmount()
 */
enum DiscountType: string implements HasDescription, HasLabel
{
    use ArrayableEnum;
    use HasEnumStaticMethods;

    case Percentage = 'percentage';

    case FixedAmount = 'fixed_amount';

    public function getLabel(): string
    {
        return match ($this) {
            self::Percentage => __('shopper-core::enum/discount.type.percentage'),
            self::FixedAmount => __('shopper-core::enum/discount.type.fixed_amount'),
        };
    }

    public function getDescription(): string
    {
        return match ($this) {
            self::Percentage => __('shopper-core::enum/discount.type.percentage_description'),
            self::FixedAmount => __('shopper-core::enum/discount.type.fixed_amount_description'),
        };
    }
}
