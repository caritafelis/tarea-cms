<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Spatie\Permission\PermissionRegistrar;
use Symfony\Component\HttpFoundation\Response;

class SetApiTeam
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        abort_unless($user, 401, 'Unauthenticated.');

        $token = $user->currentAccessToken();

        abort_unless($token, 401, 'Invalid API token.');

        $team = $token->team;

        abort_unless($team, 403, 'This API token is not associated with a team.');

        abort_unless($user->belongsToTeam($team), 403, 'The user does not belong to this team.');

        app(PermissionRegistrar::class)->setPermissionsTeamId($team->id);

        $request->attributes->set('team_id', $team->id);
        $request->attributes->set('team', $team);

        return $next($request);
    }
}
