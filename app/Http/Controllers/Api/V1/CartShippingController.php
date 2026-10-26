<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\CarrierOption;
use App\Services\Cart\CartManager;
use App\Services\Shipping\ShippingQuoteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CartShippingController extends Controller
{
    public function __construct(
        private readonly ShippingQuoteService $quotes,
        private readonly CartManager $carts,
    ) {}

    public function index(Request $request, Cart $cart): JsonResponse
    {
        $this->authorizeCart($request, $cart);
        $free = $this->quotes->isFree($cart);

        return response()->json([
            'requires_shipping' => $this->quotes->hasShippableLines($cart),
            'selected' => $this->quotes->selectedOptionId($cart),
            'issues' => $this->quotes->issues($cart),
            'data' => $this->quotes->options($cart)->map(fn (CarrierOption $o): array => [
                'id' => $o->id,
                'name' => $o->name,
                'description' => $o->description,
                'carrier' => $o->carrier?->name,
                'amount' => $free ? 0 : (int) $o->price,
                'free' => $free,
            ])->all(),
        ]);
    }

    public function update(Request $request, Cart $cart): JsonResponse
    {
        $this->authorizeCart($request, $cart);

        $data = $request->validate([
            'shipping_option_id' => ['required', 'integer', Rule::in($this->quotes->options($cart)->pluck('id')->all())],
        ]);

        $this->quotes->select($cart, (int) $data['shipping_option_id']);
        $totals = $this->carts->calculate($cart->refresh());

        return response()->json(['data' => [
            'subtotal' => $totals->subtotal,
            'discount' => $totals->discountTotal,
            'shipping' => $totals->shippingTotal,
            'tax' => $totals->taxTotal,
            'total' => $totals->total,
        ]]);
    }

    private function authorizeCart(Request $request, Cart $cart): void
    {
        $user = $request->user();

        abort_unless($cart->customer_id === $user->id || $user->can('update_order'), 403);
    }
}