<?php

namespace App\Enums;

use App\Concerns\Core\HasEnumStaticMethods;

/**
 * @method static string Enabled()
 * @method static string Disabled()
 */
enum FeatureState: string
{
    use HasEnumStaticMethods;

    case Enabled = 'enabled';

    case Disabled = 'disabled';
}
