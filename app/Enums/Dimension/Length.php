<?php

namespace App\Enums\Dimension;

use App\Concerns\Core\ArrayableEnum;
use App\Concerns\Core\HasEnumStaticMethods;
use App\Concerns\HasLabel;

/**
 * @method static string M()
 * @method static string CM()
 * @method static string MM()
 * @method static string FT()
 * @method static string IN()
 */
enum Length: string implements HasLabel
{
    use ArrayableEnum;
    use HasEnumStaticMethods;

    case M = 'm';

    case CM = 'cm';

    case MM = 'mm';

    case FT = 'ft';

    case IN = 'in';

    public function getLabel(): string
    {
        return match ($this) {
            self::M => 'm',
            self::CM => 'cm',
            self::MM => 'mm',
            self::FT => 'ft',
            self::IN => 'in',
        };
    }
}
