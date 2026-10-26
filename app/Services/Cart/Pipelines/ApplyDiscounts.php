<?php

namespace App\Services\Cart\Pipelines;

use App\Services\Cart\Discounts\DiscountCalculator;
use Closure;

final readonly class ApplyDiscounts
{
    public function __construct(
        private DiscountCalculator $calculator,
    ) {}

    public function handle(CartPipelineContext $context, Closure $next): mixed
    {
        if ($context->cart->coupon_code) {
            $this->calculator->apply($context);
        }

        return $next($context);
    }
}
