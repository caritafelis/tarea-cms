<?php

namespace App\Http\Middleware;

use App\Models\Team;
use Closure;
use Illuminate\Http\Request;
use Spatie\Permission\PermissionRegistrar;
use Symfony\Component\HttpFoundation\Response;

class SetCurrentTeamPermissions
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user) {
            $currentTeam = $user->currentTeam;

            if ($currentTeam instanceof Team) {
                $teamId = $currentTeam->id;
            } elseif (is_numeric($currentTeam)) {
                $teamId = (int) $currentTeam;
            } elseif (is_string($currentTeam) && $currentTeam !== '') {
                $teamId = $currentTeam;
            } else {
                $teamId = null;
            }

            if ($teamId !== null) {
                app(PermissionRegistrar::class)
                    ->setPermissionsTeamId($teamId);
            }
        }

        return $next($request);
    }
}