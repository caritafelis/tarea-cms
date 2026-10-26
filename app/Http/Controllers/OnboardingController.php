<?php

namespace App\Http\Controllers;

use App\Enums\{BusinessType, ProjectType};
use App\Models\{Plan, Subscription, SubscriptionPaymentMethod};
use App\Services\Billing\PaymentGatewayManager;
use App\Services\Onboarding\StarterTemplates;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;
use Inertia\Inertia;

class OnboardingController extends Controller
{
    public function show(Request $request)
    {
        $team = $request->user()->currentTeam;

        abort_unless($team, 403, 'No workspace selected.');

        $isComplete = $team->onboarding_completed_at !== null
            && filled($team->name)
            && $team->business_type !== null
            && $team->project_type !== null;

        if ($isComplete) {
            return redirect()->route('dashboard', [
                'current_team' => $team->slug,
            ]);
        }

        $options = fn (string $enum) => collect($enum::cases())->map(fn ($c) => [
            'value' => $c->value,
            'label' => method_exists($c, 'getLabel') ? $c->getLabel() : ucfirst(str_replace('_', ' ', $c->value)),
        ])->values();

        return Inertia::render('onboarding/index', [
            'team' => [
                'name' => $team->name,
                'step' => $team->onboarding_step,
                'business_type' => $team->business_type?->value,
                'project_type' => $team->project_type?->value,
            ],
            'plans' => Plan::where('is_active', true)->orderBy('sort_order')->get()->map(fn ($p) => [
                'slug' => $p->slug,
                'name' => $p->name,
                'tier' => $p->tier,
                'interval' => $p->interval,
                'has_ecommerce' => $p->has_ecommerce,
                'price_cents' => $p->price_cents,
                'features' => $p->features,
                'paypal_available' => $p->gatewayPriceId('paypal') !== null,
            ]),
            'selectedPlan' => ($sel = Plan::where('slug', $request->user()->signup_plan)->where('is_active', true)->first())
                ? ['slug' => $sel->slug, 'name' => $sel->name, 'tier' => $sel->tier, 'interval' => $sel->interval,
                'has_ecommerce' => $sel->has_ecommerce, 'price_cents' => $sel->price_cents, 'features' => $sel->features]
                : null,
            'templates' => app(StarterTemplates::class)->options($team->project_type?->value),
            'marketingUrl' => config('app.marketing_url'),
            'businessTypes' => $options(BusinessType::class),
            'projectTypes' => $options(ProjectType::class),
            'vat' => config('billing.vat_percentage'),
            'nuvei' => [
                'env' => config('billing.gateways.nuvei.js_env'),
                'code' => config('billing.gateways.nuvei.client_code'),
                'key' => config('billing.gateways.nuvei.client_key'),
            ],
        ]);
    }

    public function business(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'business_type' => ['required', new Enum(BusinessType::class)],
            'project_type' => ['required', new Enum(ProjectType::class)],
            'template' => ['nullable', Rule::in(StarterTemplates::ids())],
        ]);
        $team = $request->user()->currentTeam;
        $team->update([...collect($data)->except('template')->all(), 'onboarding_step' => 'plan']);
        app(StarterTemplates::class)->apply(
            $team,
            $request->user(),
            $data['template'] ?? ($data['project_type'] === 'sales_services' ? 'ecommerce' : 'business'),
        );
        return back();
    }

    public function free(Request $request)
    {
        $team = $request->user()->currentTeam;
        abort_unless($team && $request->user()->ownsTeam($team), 403);

        $team->forceFill(['onboarding_completed_at' => $team->onboarding_completed_at ?? now()])->save();
        Cache::forget("team:{$team->id}:entitlements");

        return redirect()->route('dashboard', ['current_team' => $team->slug]);
    }

    /**
     * gateway = "nuvei"  -> pago con tarjeta: se cobra con Nuvei; si Nuvei falla
     *                       por motivos técnicos se redirige al checkout de Stripe.
     * gateway = "paypal" -> suscripción PayPal; se activa por webhook al volver.
     */
    public function checkout(Request $request, PaymentGatewayManager $gateways)
    {
        $user = $request->user();
        $team = $user->currentTeam;
        abort_unless($team && $user->ownsTeam($team), 403);

        $data = $request->validate([
            'plan' => ['required', Rule::exists('plans', 'slug')->where('is_active', true)],
            'gateway' => ['required', Rule::in(['nuvei', 'paypal'])],
            'card.token' => ['required_if:gateway,nuvei', 'string'],
            'card.brand' => ['nullable', 'string'],
            'card.holder_name' => ['nullable', 'string'],
            'card.last_four' => ['nullable', 'string', 'size:4'],
            'card.exp_month' => ['nullable', 'integer'],
            'card.exp_year' => ['nullable', 'integer'],
        ]);

        $plan = Plan::where('slug', $data['plan'])->firstOrFail();
        abort_if($plan->price_cents === 0, 422, 'Contact sales for this plan.');

        // Reutiliza el intento pendiente para no acumular filas si reintenta
        $subscription = Subscription::updateOrCreate(
            ['team_id' => $team->id, 'stripe_status' => 'incomplete'],
            [
                'user_id' => $user->id, 'plan_id' => $plan->id, 'type' => 'default',
                'gateway' => $data['gateway'], 'stripe_id' => 'pending_'.uniqid(), 'auto_renew' => true,
            ],
        );

        if ($data['gateway'] === 'paypal') {
            if (! $plan->gatewayPriceId('paypal')) {
                return back()->withErrors(['gateway' => 'PayPal is not available for this plan yet.']);
            }

            $url = $gateways->driver('paypal')->createSubscription($user, $plan, $subscription);

            return Inertia::location($url); // PayPal: NO activa aquí, espera al webhook
        }

        // ---- Tarjeta: Nuvei primero ----
        $nuvei = $gateways->driver('nuvei');

        try {
            $result = $nuvei->chargeCard(
                $user,
                $plan,
                $data['card']['token'],
                "onboarding-{$subscription->id}-".Str::uuid()
            );
        } catch (\Throwable $e) {
            report($e);

            return $this->stripeFallback($gateways, $subscription, $user, $plan);
        }

        if (! $result['ok']) {
            // Rechazo real de la tarjeta: no se cambia de proveedor, el usuario corrige o usa otra tarjeta.
            return back()->withErrors(['card' => $result['message'] ?? 'The card was declined.']);
        }

        $this->rememberCard($user, $data['card']);

        $subscription->update([
            'stripe_status' => 'active',
            'stripe_id' => 'nuvei_'.$result['id'],
            'plan_id' => $plan->id,
            'auto_renew' => true,
            'ends_at' => null,
            'renewal_attempts' => 0,
            'renews_at' => $plan->interval === 'year' ? now()->addYear() : now()->addMonth(),
        ]);

        $team->forceFill([
            'onboarding_completed_at' => $team->onboarding_completed_at ?? now(),
        ])->save();

        Cache::forget("team:{$team->id}:entitlements");

        return redirect()->route('dashboard', ['current_team' => $team->slug]);
    }

    /** PayPal vuelve aquí. NO activa: espera al webhook. */
    public function paypalReturn(Request $request)
    {
        return redirect()->route('onboarding.show')->with('success', 'Confirming your payment…');
    }

    private function stripeFallback(PaymentGatewayManager $gateways, Subscription $subscription, $user, Plan $plan)
    {
        try {
            $url = $gateways->driver('stripe')->createCheckoutUrl($user, $plan);
        } catch (\Throwable $e) {
            report($e);

            return back()->withErrors([
                'card' => 'We could not process card payments right now. Please try again or pay with PayPal.',
            ]);
        }

        $subscription->update(['gateway' => 'stripe']);

        return Inertia::location($url);
    }

    private function rememberCard($user, array $card): void
    {
        SubscriptionPaymentMethod::updateOrCreate(
            ['user_id' => $user->id, 'gateway' => 'nuvei', 'gateway_payment_method_id' => $card['token']],
            [
                'type' => 'card',
                'brand' => $card['brand'] ?? null,
                'last_four' => $card['last_four'] ?? null,
                'exp_month' => $card['exp_month'] ?? null,
                'exp_year' => $card['exp_year'] ?? null,
                'is_primary' => ! $user->paymentMethods()->where('is_primary', true)->exists(),
            ]
        );
    }
}