<?php

namespace App\Services\Auth;

use App\Models\Team;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Laravel\Sanctum\NewAccessToken;

class TeamApiTokenService
{
    public function create(User $user, Team $team, string $name, array $abilities = ['*'], ?\DateTimeInterface $expiresAt = null): NewAccessToken
    {
        if (! $user->belongsToTeam($team)) {
            throw new AuthorizationException('The user does not belong to the selected team.');
        }

        $plain = $user->generateTokenString();

        $accessToken = $user->tokens()->make([
            'name' => $name,
            'token' => hash('sha256', $plain),
            'abilities' => $abilities,
            'expires_at' => $expiresAt,
        ]);

        $accessToken->forceFill(['team_id' => $team->id])->save();

        return new NewAccessToken($accessToken, $accessToken->getKey().'|'.$plain);
    }

    public function revoke(User $user,int $tokenId): void 
    {
        $user->tokens()->whereKey($tokenId)->delete();
    }

    public function revokeForTeam(User $user,Team $team): void 
    {
        $user->tokens()->where('team_id', $team->id)->delete();
    }
}
