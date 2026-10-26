<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Cart\CreateOrderFromCartAction;
use App\Http\Controllers\Controller;
use App\Models\Cart\Cart;
use App\Models\PaymentMethod;
use App\Services\Cart\Exceptions\CartCompletedException;
use App\Services\Cart\Exceptions\DiscountLimitReachedException;
use App\Services\Cart\Exceptions\InsufficientStockException;
use App\Services\Payment\PaymentProcessingService;
use Illuminate\Contracts\Support\Responsable;
use Illuminate\Http\Request;
use LaravelJsonApi\Core\Document\Error;
use LaravelJsonApi\Core\Responses\DataResponse;
use LaravelJsonApi\Core\Responses\ErrorResponse;
use LaravelJsonApi\Laravel\Http\Controllers\Actions;

class CartController extends Controller
{
    use Actions\AttachRelationship;
    use Actions\Destroy;
    use Actions\DetachRelationship;
    use Actions\FetchMany;
    use Actions\FetchOne;
    use Actions\FetchRelated;
    use Actions\FetchRelationship;
    use Actions\Store;
    use Actions\Update;
    use Actions\UpdateRelationship;

    /**
     * POST /carts/{cart}/-actions/checkout
     * Body: {"data":{"type":"carts","id":"1","attributes":{"paymentMethodId":3}}}
     * Devuelve la Order creada (201) con meta.payment (redirectUrl / clientSecret).
     */
    public function checkout(
        Request $request,
        Cart $cart,
        CreateOrderFromCartAction $createOrder,
        PaymentProcessingService $payments,
    ): Responsable {
        if ($cart->customer_id !== $request->user()->id) {
            return $this->error('403', 'Forbidden', 'This cart does not belong to you.');
        }

        $paymentMethod = PaymentMethod::query()
            ->where('is_enabled', true)
            ->find($request->input('data.attributes.paymentMethodId'));

        if (! $paymentMethod) {
            return $this->error(
                '422',
                'Unprocessable Entity',
                'A valid, enabled payment method is required.',
                '/data/attributes/paymentMethodId'
            );
        }

        try {
            $order = $createOrder->execute($cart);
        } catch (CartCompletedException|InsufficientStockException|DiscountLimitReachedException $e) {
            return $this->error('409', 'Conflict', $e->getMessage() ?: class_basename($e));
        }

        $order->update(['payment_method_id' => $paymentMethod->id]);
        $order->load('paymentMethod');

        $result = $payments->initiate($order);

        return DataResponse::make($order)
            ->withMeta(['payment' => $result->toArray()])
            ->didCreate();
    }

    private function error(string $status, string $title, string $detail, ?string $pointer = null): ErrorResponse
    {
        $error = ['status' => $status, 'title' => $title, 'detail' => $detail];

        if ($pointer) {
            $error['source'] = ['pointer' => $pointer];
        }

        return ErrorResponse::make(Error::fromArray($error));
    }
}
