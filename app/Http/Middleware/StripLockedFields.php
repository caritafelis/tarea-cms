<?php

namespace App\Http\Middleware;

use App\Support\Entitlements;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Descarta campos premium en escrituras, antes de llegar al controller. */
class StripLockedFields
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->isMethodSafe() && ! $request->user()?->is_super_admin) {
            $team = $request->user()?->currentTeam;

            if ($request->isJson()) {
                $request->json()->replace(Entitlements::strip($team, $request->json()->all()));
            } else {
                $request->request->replace(Entitlements::strip($team, $request->request->all()));
            }
        }

        return $next($request);
    }
}