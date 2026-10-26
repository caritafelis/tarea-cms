<?php

namespace App\Contracts;

use App\Services\Taxes\TaxCalculationContext;
use App\Services\Taxes\TaxLine;

interface TaxCalculationProvider
{
    public function identifier(): string;

    /**
     * Calculate tax lines for a given taxable item within a context.
     *
     * @return array<int, TaxLine>
     */
    public function getTaxLines(TaxableItem $item, TaxCalculationContext $context): array;
}
