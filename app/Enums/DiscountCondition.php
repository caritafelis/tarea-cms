<?php

namespace App\Enums;

use App\Concerns\Core\ArrayableEnum;
use App\Concerns\Core\HasEnumStaticMethods;
use App\Concerns\HasLabel;

/**
 * @method static string ApplyTo()
 * @method static string Eligibility()
 */
enum DiscountCondition: string implements HasLabel
{
    use ArrayableEnum;
    use HasEnumStaticMethods;

    case ApplyTo = 'apply_to';

    case Eligibility = 'eligibility';

    public function getLabel(): string
    {
        return match ($this) {
            self::ApplyTo => __('shopper-core::enum/discount.condition.apply_to'),
            self::Eligibility => __('shopper-core::enum/discount.condition.eligibility'),
        };
    }
}
