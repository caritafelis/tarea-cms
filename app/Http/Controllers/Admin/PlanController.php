<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Billing\PlanRequest;
use App\Jobs\SyncPlanGateways;
use App\Models\Plan;
use App\Models\Subscription;
use App\Services\Billing\PlanGatewaySyncService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;

class PlanController extends Controller
{
    public function store( PlanRequest $request, string $current_team ): RedirectResponse 
    {
        $plan = DB::transaction(function () use ($request): Plan {
            return Plan::create($this->attributes($request));
        });

        SyncPlanGateways::dispatch($plan->id)->afterCommit();

        return back()->with(
            'success',
            'Plan created. Gateway synchronization has been queued.'
        );
    }

    public function update( PlanRequest $request, string $current_team, Plan $plan ): RedirectResponse 
    {
        DB::transaction(function () use ($request, $plan): void {
            $plan->update($this->attributes($request, $plan));
        });

        SyncPlanGateways::dispatch($plan->id)->afterCommit();

        return back()->with(
            'success',
            'Plan updated. Gateway synchronization has been queued.'
        );
    }

    public function sync( Request $request, string $current_team, Plan $plan, PlanGatewaySyncService $service ): RedirectResponse 
    {
        $gateway = $request->validate([
            'gateway' => ['nullable', Rule::in(['stripe', 'paypal'])],
        ])['gateway'] ?? null;

        $gateway ? $service->syncGateway($plan, $gateway) : $service->sync($plan);

        $targets = $gateway ? [$gateway] : ['stripe', 'paypal'];

        $failed = $plan->gatewaySyncs()->get()->contains(
            fn ($s) => in_array($s->gateway, $targets, true)
                && $s->environment === PlanGatewaySyncService::environmentFor($s->gateway)
                && $s->status === 'failed'
        );

        return $failed
            ? back()->with('error', 'Synchronization finished with errors. Check the gateway status of the plan.')
            : back()->with('success', 'Plan synchronized.');
    }

    public function destroy( string $current_team, Plan $plan ): RedirectResponse 
    {
        if (Subscription::query()->where('plan_id', $plan->id)->exists()) {
            $plan->update(['is_active' => false]);

            return back()->with(
                'error',
                'This plan has subscribers, so it was deactivated instead of deleted.'
            );
        }

        $plan->delete();

        return back()->with('success', 'Plan deleted.');
    }

    private function attributes( PlanRequest $request, ?Plan $plan = null ): array 
    {
        $hasEcommerce = $request->has('has_ecommerce')
            ? $request->boolean('has_ecommerce')
            : (bool) ($plan?->has_ecommerce ?? false);

        return [
            'name' => $request->validated('name'),
            'slug' => $request->validated('slug'),
            'tier' => $request->validated('tier'),
            'has_ecommerce' => $hasEcommerce,
            'price_cents' => $request->priceCents(),
            'currency' => strtolower($request->validated('currency')),
            'interval' => $request->validated('interval'),
            'gateway' => $request->validated('gateway')
                ?? $plan?->gateway
                ?? config('billing.default_gateway', 'stripe'),
            'gateway_price_id' => $plan?->gateway_price_id,
            'features' => $request->validated('features') ?? [],
            'entitlements' => $this->entitlements(
                $request->validated('tier'),
                $hasEcommerce,
                $plan
            ),
            'is_active' => $request->boolean('is_active', true),
            'sort_order' => $request->validated('sort_order') ?? 0,
        ];
    }

    private function entitlements( string $tier, bool $hasEcommerce, ?Plan $plan ): array 
    {
        $source = $plan?->entitlements
            ?: Plan::query()
                ->where('tier', $tier)
                ->where('has_ecommerce', $hasEcommerce)
                ->where('interval', 'month')
                ->when(
                    $plan,
                    fn ($query) => $query->whereKeyNot($plan->id)
                )
                ->first()
                ?->entitlements
            ?: ['modules' => ['cms'], 'limits' => []];

        $modules = collect(
            $source['modules'] ?? ['cms']
        )->reject(
            fn ($module) => $module === 'ecommerce'
        );

        if ($hasEcommerce) {
            $modules->push('ecommerce');
        } else {
            unset($source['limits']['products']);
        }

        $source['modules'] = $modules
            ->unique()
            ->values()
            ->all();

        return $source;
    }
}