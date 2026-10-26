<?php

namespace App\Http\Middleware;

use App\Models\Cpt;
use App\Support\Entitlements;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;
use Inertia\Middleware;
use Laravel\Fortify\Features;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $team = $user?->currentTeam;

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user ? array_merge($user->toArray(), [
                    'permissions' => $user->getAllPermissions()->pluck('name')->values()->all(),
                ]) : null,
            ],
            'logoUrl' => $team?->logo_url,
            'environment' => $team?->environment,
            'standaloneModules' => fn () => $user
                ? Cpt::active()
                    ->where('is_standalone', true)
                    ->get()
                    ->map(fn ($g) => [
                        'id' => $g->id,
                        'title' => $g->title,
                        'slug' => $g->slug,
                        'label' => $g->standalone_label ?? $g->title,
                        'icon' => $g->standalone_icon ?? 'Layers',
                    ])
                    ->toArray()
                : [],
            'security' => fn () => [
                'canManageTwoFactor' => Features::canManageTwoFactorAuthentication(),

                'canManagePasskeys' => Features::canManagePasskeys(),

                'passkeys' => Features::canManagePasskeys() && $user
                    ? $user->passkeys()
                        ->select([
                            'id',
                            'name',
                            'credential',
                            'created_at',
                            'last_used_at',
                        ])
                        ->latest()
                        ->get()
                        ->map(fn ($passkey) => [
                            'id' => $passkey->id,
                            'name' => $passkey->name,
                            'authenticator' => $passkey->authenticator,
                            'created_at_diff' => $passkey->created_at->diffForHumans(),
                            'last_used_at_diff' => $passkey->last_used_at?->diffForHumans(),
                        ])
                        ->values()
                        ->all()
                    : [],

                'passwordRules' => Password::defaults()->toPasswordRulesString(),

                'twoFactorEnabled' => $user?->hasEnabledTwoFactorAuthentication() ?? false,

                'requiresConfirmation' => Features::optionEnabled(
                    Features::twoFactorAuthentication(),
                    'confirm'
                ),
            ],
            'entitlements' => function () use ($request) {
                $user = $request->user();

                if (! $user?->currentTeam) {
                    return ['modules' => [], 'limits' => [], 'fields' => []];
                }

                $fields = Entitlements::fieldMap();

                if ($user->is_super_admin) {
                    return ['modules' => config('entitlements.modules'), 'limits' => [], 'fields' => $fields];
                }

                return [...$user->currentTeam->entitlements(), 'fields' => $fields];
            },
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'currentTeam' => fn () => $user?->currentTeam ? $user->toUserTeam($user->currentTeam) : null,
            'teams' => fn () => $user?->toUserTeams(includeCurrent: true) ?? [],
        ];
    }
}