<?php

namespace App\Services\Taxes;

final readonly class TaxLine
{
    public function __construct(
        public int $taxRateId,
        public string $name,
        public ?string $code,
        public float $rate,
        public int $amount,
    ) {}
}
