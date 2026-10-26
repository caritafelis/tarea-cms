<?php

namespace App\GraphQL\Mutations;

use App\Actions\Cart\CreateOrderFromCartAction;
use App\GraphQL\Support\ResolvesOwnCart;
use App\Models\PaymentMethod;
use App\Services\Cart\Exceptions\CartCompletedException;
use App\Services\Cart\Exceptions\DiscountLimitReachedException;
use App\Services\Cart\Exceptions\InsufficientStockException;
use App\Services\Payment\PaymentProcessingService;
use GraphQL\Error\Error;

class CheckoutCart
{
    use ResolvesOwnCart;

    public function __construct(
        private readonly CreateOrderFromCartAction $createOrder,
        private readonly PaymentProcessingService $payments,
    ) {}

    public function __invoke($root, array $args): array
    {
        $cart = $this->ownCart($args['cart_id']);

        $method = PaymentMethod::query()->where('is_enabled', true)->find($args['payment_method_id']);

        if (! $method) {
            throw new Error('A valid, enabled payment method is required.');
        }

        try {
            $order = $this->createOrder->execute($cart);
        } catch (CartCompletedException|InsufficientStockException|DiscountLimitReachedException $e) {
            throw new Error($e->getMessage() ?: class_basename($e));
        }

        $order->update(['payment_method_id' => $method->id]);
        $order->load('paymentMethod');

        return ['order' => $order, 'payment' => $this->payments->initiate($order)->toArray()];
    }
}