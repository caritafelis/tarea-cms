<?php

namespace App\Services\Cart\Pipelines;

use Closure;

final class Calculate
{
    public function handle(CartPipelineContext $context, Closure $next): mixed
    {
        $base = $context->subtotal - $context->discountTotal + $context->shippingTotal;
        $context->total = max(0, $context->taxInclusive ? $base : $base + $context->taxTotal);

        return $next($context);
    }
}
