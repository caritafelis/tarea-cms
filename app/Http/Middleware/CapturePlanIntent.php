<?php

namespace App\Http\Middleware;

use App\Models\Plan;
use Closure;
use Illuminate\Http\Request;

class CapturePlanIntent
{
    public function handle(Request $request, Closure $next)
    {
        if (! $request->is('register')) {
            return $next($request);
        }

        $slug = $request->query('plan', $request->input('plan', $request->session()->get('signup_plan')));
        $plan = $slug ? Plan::where('slug', $slug)->where('is_active', true)->first() : null;

        if ($plan) {
            $request->session()->put('signup_plan', $plan->slug);

            return $next($request);
        }

        if (str_contains((string) $request->session()->get('url.intended'), '/invitations/')) {
            return $next($request);
        }

        return redirect()->away(rtrim(config('app.marketing_url'), '/').'/pricing');
    }
}