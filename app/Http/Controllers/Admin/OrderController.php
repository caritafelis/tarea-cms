<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OrderController extends Controller
{
    public function index(string $current_team)
    {
        $orders = Order::with(['customer', 'items.product'])->orderBy('created_at', 'desc')->get();

        return Inertia::render('admin/orders/index', [
            'orders' => $orders,
        ]);
    }

    public function show(string $current_team, Order $order)
    {
        return Inertia::render('admin/orders/show', [
            'order' => $order->load([
                'customer', 'items.product', 'transactions', 'shippingAddress', 'billingAddress',
                'paymentMethod', 'shippingOption', 'shipments', 'refund',
            ]),
        ]);
    }

    public function update(Request $request, string $current_team, Order $order)
    {
        // Real cases on App\Enums\OrderStatus: new, processing, completed, cancelled, archived.
        $request->validate([
            'status' => 'required|string|in:new,processing,completed,cancelled,archived',
        ]);

        $order->update(['status' => $request->status]);

        return redirect()
            ->route('admin.orders.index', ['current_team' => $current_team])
            ->with('success', 'Order status updated successfully.');
    }
}
