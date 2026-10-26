<?php

namespace App\Enums;

use App\Concerns\Core\ArrayableEnum;
use App\Concerns\Core\HasEnumStaticMethods;
use App\Concerns\HasLabel;

/**
 * @method static string Male()
 * @method static string Female()
 */
enum GenderType: string implements HasLabel
{
    use ArrayableEnum;
    use HasEnumStaticMethods;

    case Female = 'female';

    case Male = 'male';

    public function getLabel(): string
    {
        return match ($this) {
            self::Female => __('shopper::words.female'),
            self::Male => __('shopper::words.male'),
        };
    }
}
