<?php

namespace App\Services\Cart\Pipelines;

use App\Models\Cart\Cart;
use App\Models\CarrierOption;

final class CartPipelineContext
{
    public int $subtotal = 0;

    public int $discountTotal = 0;

    public int $taxTotal = 0;

    public int $total = 0;

    public bool $taxInclusive = false;

    /** @var array<int, int> */
    public array $lineSubtotals = [];

    public function __construct(
        public readonly Cart $cart,
    ) {}

    public int $shippingTotal = 0;
    public ?CarrierOption $shippingOption = null;
    /** @var array<int, array{code: string, message: string}> */
    public array $shippingIssues = [];
}
