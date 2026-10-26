<?php

namespace App\Enums\Dimension;

use App\Concerns\Core\ArrayableEnum;
use App\Concerns\Core\HasEnumStaticMethods;
use App\Concerns\HasLabel;

/**
 * @method static string L()
 * @method static string ML()
 * @method static string GAL()
 * @method static string FLOZ()
 */
enum Volume: string implements HasLabel
{
    use ArrayableEnum;
    use HasEnumStaticMethods;

    case L = 'l';

    case ML = 'ml';

    case GAL = 'gal';

    case FLOZ = 'floz';

    public function getLabel(): string
    {
        return match ($this) {
            self::L => 'l',
            self::ML => 'ml',
            self::GAL => 'gal',
            self::FLOZ => 'floz',
        };
    }
}
