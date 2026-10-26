<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Billing\StorePaymentMethodRequest;
use App\Models\Invoice;
use App\Models\Plan;
use App\Models\SubscriptionPaymentMethod;
use App\Services\Billing\BillingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class BillingController extends Controller
{
    public function __construct(private readonly BillingService $billing) {}

    public function switchPlan(Request $request, Plan $plan): RedirectResponse
    {
        abort_unless($plan->is_active, 404);

        $redirectUrl = $this->billing->switchPlan($request->user(), $plan);

        // Checkout hospedado (nueva suscripción) -> afuera; swap directo -> volvemos.
        return str_starts_with($redirectUrl, 'http') && ! str_starts_with($redirectUrl, url('/'))
            ? redirect()->away($redirectUrl)
            : redirect($redirectUrl)->with('success', 'Plan updated.');
    }

    public function toggleAutoRenewal(Request $request): RedirectResponse
    {
        $request->validate(['enabled' => 'required|boolean']);

        $this->billing->toggleAutoRenew($request->user(), $request->boolean('enabled'));

        return back()->with('success', $request->boolean('enabled')
            ? 'Auto-renewal enabled.'
            : 'Auto-renewal disabled — your plan will not renew at the end of the period.');
    }

    public function cancelSubscription(Request $request): RedirectResponse
    {
        $this->billing->cancel($request->user());

        return back()->with('success', 'Subscription will be cancelled at the end of the billing period.');
    }

    public function resumeSubscription(Request $request): RedirectResponse
    {
        $this->billing->resume($request->user());

        return back()->with('success', 'Subscription resumed.');
    }

    public function updateContact(Request $request): RedirectResponse
    {
        $request->validate(['billing_email' => ['nullable', 'email']]);

        $request->user()->update(['billing_email' => $request->input('billing_email')]);

        return back()->with('success', 'Billing email updated.');
    }

    public function storePaymentMethod(StorePaymentMethodRequest $request): RedirectResponse
    {
        $method = $this->billing->attachPaymentMethod(
            $request->user(),
            $request->validated('gateway'),
            $request->validated('token'),
            $request->validated('name'),
        );

        if ($request->boolean('make_default')) {
            $this->billing->setDefaultPaymentMethod($method);
        }

        return back()->with('success', 'Payment method added.');
    }

    public function setDefaultPaymentMethod(Request $request, SubscriptionPaymentMethod $paymentMethod): RedirectResponse
    {
        abort_unless($paymentMethod->user_id === $request->user()->id, 403);

        $this->billing->setDefaultPaymentMethod($paymentMethod);

        return back()->with('success', 'Default payment method updated.');
    }

    public function destroyPaymentMethod(Request $request, SubscriptionPaymentMethod $paymentMethod): RedirectResponse
    {
        abort_unless($paymentMethod->user_id === $request->user()->id, 403);

        $this->billing->deletePaymentMethod($paymentMethod);

        return back()->with('success', 'Payment method removed.');
    }

    public function downloadInvoice(Request $request, Invoice $invoice)
    {
        abort_unless($invoice->user_id === $request->user()->id, 403);
        abort_unless($invoice->pdf_url, 404, 'Invoice PDF not available.');

        return redirect()->away($invoice->pdf_url);
    }
}
