<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PaymentMethod;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PaymentMethodController extends Controller
{
    public function index(string $current_team)
    {
        return Inertia::render('admin/payment-methods/index', [
            'paymentMethods' => PaymentMethod::query()->orderBy('title')->get(),
        ]);
    }

    public function create(string $current_team)
    {
        return Inertia::render('admin/payment-methods/create');
    }

    public function store(Request $request, string $current_team)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:payment_methods,slug',
            'logo' => 'nullable|string|max:255',
            'link_url' => 'nullable|url|max:255',
            'description' => 'nullable|string',
            'instructions' => 'nullable|string',
            'driver' => 'nullable|string|max:255',
            'is_enabled' => 'boolean',
        ]);

        PaymentMethod::create($data);

        return redirect()->route('admin.payment-methods.index', ['current_team' => $current_team])->with('success', 'Payment method created successfully.');
    }

    public function show(string $current_team, PaymentMethod $paymentMethod)
    {
        return Inertia::render('admin/payment-methods/show', [
            'paymentMethod' => $paymentMethod,
        ]);
    }

    public function edit(string $current_team, PaymentMethod $paymentMethod)
    {
        return Inertia::render('admin/payment-methods/edit', [
            'paymentMethod' => $paymentMethod,
        ]);
    }

    public function update(Request $request, string $current_team, PaymentMethod $paymentMethod)
    {
        $data = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:payment_methods,slug,'.$paymentMethod->id,
            'logo' => 'nullable|string|max:255',
            'link_url' => 'nullable|url|max:255',
            'description' => 'nullable|string',
            'instructions' => 'nullable|string',
            'driver' => 'nullable|string|max:255',
            'is_enabled' => 'boolean',
        ]);

        $paymentMethod->update($data);

        return redirect()->route('admin.payment-methods.index', ['current_team' => $current_team])->with('success', 'Payment method updated successfully.');
    }

    public function destroy(string $current_team, PaymentMethod $paymentMethod)
    {
        $paymentMethod->delete();

        return redirect()->route('admin.payment-methods.index', ['current_team' => $current_team])->with('success', 'Payment method deleted successfully.');
    }
}
