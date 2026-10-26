<?php

namespace App\Services\Cart\Pipelines;

use Closure;

final class CalculateLines
{
    public function handle(CartPipelineContext $context, Closure $next): mixed
    {
        foreach ($context->cart->lines as $line) {
            $current = $line->purchasable?->getPrice($context->cart->currency_code)?->effectiveAmount();

            if ($current !== null && $current !== (int) $line->unit_price_amount) {
                $line->update(['unit_price_amount' => $current]);
            }

            $subtotal = $line->unit_price_amount * $line->quantity;
            $context->lineSubtotals[$line->id] = $subtotal;
            $context->subtotal += $subtotal;
        }

        return $next($context);
    }
}
