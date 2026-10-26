<?php

namespace App\Enums;

use App\Concerns\Core\ArrayableEnum;
use App\Concerns\Core\HasEnumStaticMethods;
use App\Concerns\HasLabel;

/**
 * The kind of business/site the user is registering, captured during
 * onboarding so the team can be provisioned accordingly.
 *
 * @method static string Retail()
 * @method static string Wholesale()
 * @method static string Services()
 * @method static string Agency()
 * @method static string Personal()
 * @method static string Other()
 */
enum BusinessType: string implements HasLabel
{
    use ArrayableEnum;
    use HasEnumStaticMethods;

    case Retail = 'retail';
    case Wholesale = 'wholesale';
    case Services = 'services';
    case Agency = 'agency';
    case Personal = 'personal';
    case Other = 'other';

    public function getLabel(): string
    {
        return match ($this) {
            self::Retail => 'Retail store',
            self::Wholesale => 'Wholesale / B2B',
            self::Services => 'Services',
            self::Agency => 'Agency / Studio',
            self::Personal => 'Personal / Portfolio',
            self::Other => 'Other',
        };
    }
}
