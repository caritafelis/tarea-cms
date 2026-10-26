<?php

namespace App\Enums;

use App\Concerns\Core\ArrayableEnum;
use App\Concerns\Core\HasEnumStaticMethods;
use App\Concerns\HasLabel;

/**
 * The hosting/plan tier chosen for the team, mirroring the shared /
 * business / dedicated tiers common among WordPress hosting providers.
 *
 * @method static string Shared()
 * @method static string Business()
 * @method static string Dedicated()
 * @method static string Enterprise()
 */
enum HostingPlan: string implements HasLabel
{
    use ArrayableEnum;
    use HasEnumStaticMethods;

    case Shared = 'shared';
    case Business = 'business';
    case Dedicated = 'dedicated';
    case Enterprise = 'enterprise';

    public function getLabel(): string
    {
        return match ($this) {
            self::Shared => 'Shared hosting',
            self::Business => 'Business hosting',
            self::Dedicated => 'Dedicated hosting',
            self::Enterprise => 'Enterprise',
        };
    }

    /**
     * Soft limits used to gate plan-dependent features (e.g. number of
     * team members, storage quota). Not enforced by the migration itself.
     */
    public function memberLimit(): ?int
    {
        return match ($this) {
            self::Shared => 3,
            self::Business => 10,
            self::Dedicated => 50,
            self::Enterprise => null,
        };
    }
}
