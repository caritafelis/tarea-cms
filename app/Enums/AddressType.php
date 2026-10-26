<?php

namespace App\Enums;

use App\Concerns\Core\ArrayableEnum;
use App\Concerns\Core\HasEnumStaticMethods;
use App\Concerns\HasLabel;

/**
 * @method static string Billing()
 * @method static string Shipping()
 */
enum AddressType: string implements HasLabel
{
    use ArrayableEnum;
    use HasEnumStaticMethods;

    case Billing = 'billing';

    case Shipping = 'shipping';

    public function getLabel(): string
    {
        return match ($this) {
            self::Billing => __('shopper-core::enum/address.billing'),
            self::Shipping => __('shopper-core::enum/address.shipping'),
        };
    }
}
