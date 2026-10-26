<?php

namespace App\Services\Cart\Discounts;

final readonly class DiscountValidationResult
{
    public function __construct(
        public bool $valid,
        public ?string $failureReason = null,
    ) {}
}
