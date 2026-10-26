<?php

namespace App\Services\Cart\Pipelines;

use App\Services\Shipping\ShippingQuoteService;
use Closure;

final readonly class CalculateShipping
{
    public function __construct(private ShippingQuoteService $quotes) {}

    public function handle(CartPipelineContext $context, Closure $next): mixed
    {
        $result = $this->quotes->evaluate($context->cart);

        $context->shippingTotal = $result['amount'];
        $context->shippingOption = $result['option'];
        $context->shippingIssues = $result['issues'];

        return $next($context);
    }
}