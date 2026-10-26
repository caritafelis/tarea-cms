<?php

namespace App\Enums\Dimension;

use App\Concerns\Core\ArrayableEnum;
use App\Concerns\Core\HasEnumStaticMethods;
use App\Concerns\HasLabel;

/**
 * @method static string KG()
 * @method static string G()
 * @method static string LBS()
 */
enum Weight: string implements HasLabel
{
    use ArrayableEnum;
    use HasEnumStaticMethods;

    case KG = 'kg';

    case G = 'g';

    case LBS = 'lbs';

    public function getLabel(): string
    {
        return match ($this) {
            self::KG => 'kg',
            self::G => 'g',
            self::LBS => 'lbs',
        };
    }
}
