<?php

namespace App\Services\Taxes;

use App\Models\TaxZone;

final readonly class TaxCalculationContext
{
    public function __construct(
        public string $countryCode,
        public ?string $provinceCode = null,
        public ?int $customerId = null,
        public ?TaxZone $resolvedZone = null,
    ) {}

    public function cacheKey(): string
    {
        return $this->countryCode.':'.($this->provinceCode ?? '');
    }
}
