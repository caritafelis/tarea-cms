<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureOnboarding
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || $user->is_super_admin) {
            return $next($request);
        }

        $team = $user->currentTeam;

        if (! $team) {
            return $next($request);
        }

        if ($request->routeIs(
            'onboarding.*',
            'admin.settings.billing.*',
            'settings.*',
            'teams.*'
        )) {
            return $next($request);
        }
        if (is_null($team->onboarding_completed_at)) {
            return redirect()->route('onboarding.show');
        }

        if (! $team->activeSubscription()) {
            if ($request->routeIs('admin.settings.index')) {
                return $next($request);
            }

            return redirect()
                ->route('admin.settings.index', [
                    'current_team' => $team->slug,
                    'tab' => 'billing',
                ])
                ->with(
                    'error',
                    'Your subscription is inactive. Please renew to continue.'
                );
        }

        return $next($request);
    }
}