<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCanSyncPermissions
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        abort_unless($user, 403);

        $team = $user->currentTeam;

        abort_unless($team, 403);

        $allowed = $user->hasAnyRole([
            'Owner',
            'Admin',
        ]);

        abort_unless($allowed, 403);

        return $next($request);
    }
}