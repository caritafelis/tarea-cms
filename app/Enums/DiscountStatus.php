<?php

namespace App\Enums;

use App\Concerns\Core\ArrayableEnum;
use App\Concerns\Core\HasEnumStaticMethods;
use App\Concerns\HasColor;
use App\Concerns\HasIcon;
use App\Concerns\HasLabel;

/**
 * @method static string Draft()
 * @method static string Scheduled()
 * @method static string Active()
 * @method static string Disabled()
 * @method static string Expired()
 * @method static string LimitReached()
 */
enum DiscountStatus: string implements HasColor, HasIcon, HasLabel
{
    use ArrayableEnum;
    use HasEnumStaticMethods;

    case Draft = 'draft';

    case Scheduled = 'scheduled';

    case Active = 'active';

    case Disabled = 'disabled';

    case Expired = 'expired';

    case LimitReached = 'limit_reached';

    public function getColor(): string
    {
        return match ($this) {
            self::Draft, self::Disabled => 'gray',
            self::Scheduled => 'info',
            self::Active => 'success',
            self::Expired, self::LimitReached => 'warning',
        };
    }

    public function getIcon(): string
    {
        return match ($this) {
            self::Draft => 'untitledui-file-04',
            self::Scheduled => 'untitledui-clock',
            self::Active => 'untitledui-check-circle',
            self::Disabled => 'untitledui-eye-off',
            self::Expired => 'untitledui-hourglass-03',
            self::LimitReached => 'untitledui-bar-chart-square-up',
        };
    }

    public function getLabel(): string
    {
        return match ($this) {
            self::Draft => __('shopper-core::status.discount.draft'),
            self::Scheduled => __('shopper-core::status.discount.scheduled'),
            self::Active => __('shopper-core::status.discount.active'),
            self::Disabled => __('shopper-core::status.discount.disabled'),
            self::Expired => __('shopper-core::status.discount.expired'),
            self::LimitReached => __('shopper-core::status.discount.limit_reached'),
        };
    }
}
