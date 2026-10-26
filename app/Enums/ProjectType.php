<?php

namespace App\Enums;

use App\Concerns\Core\ArrayableEnum;
use App\Concerns\Core\HasEnumStaticMethods;
use App\Concerns\HasLabel;

/**
 * Whether the team is building a corporate/brochure site or a
 * sales/services (e-commerce-capable) project. Drives which admin
 * modules (catalog, orders, discounts...) are surfaced for the team.
 *
 * @method static string Corporate()
 * @method static string SalesServices()
 */
enum ProjectType: string implements HasLabel
{
    use ArrayableEnum;
    use HasEnumStaticMethods;

    case Corporate = 'corporate';
    case SalesServices = 'sales_services';

    public function getLabel(): string
    {
        return match ($this) {
            self::Corporate => 'Corporate / Institutional site',
            self::SalesServices => 'Sales / Services (e-commerce)',
        };
    }

    public function usesCommerceModules(): bool
    {
        return $this === self::SalesServices;
    }
}
