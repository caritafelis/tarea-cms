<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTeamHasModule
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string $module)
    {
        $team = $request->user()->currentTeam;
        abort_unless($team?->hasModule($module), 403, 'Module not included in your plan.');
        return $next($request);
    }
}