<?php

namespace App\Services\Settings;

use App\Models\ApiKey;
use App\Models\Team;
use App\Models\User;
use App\Support\ApiAbilities;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;

class ApiKeyService
{
    public function create(string $name, array $abilities, ?string $expiresAt, string $environment, Team $team): array
    {
        $abilities = ApiAbilities::normalize($abilities);

        return $this->issue(
            $name,
            $abilities,
            $expiresAt ? Carbon::parse($expiresAt) : null,
            $environment,
            Auth::user(),
            $team->id,
        );
    }

    public function regenerate(ApiKey $apiKey, Team $team): array
    {
        $owner = ($apiKey->user_id ? User::find($apiKey->user_id) : null) ?? Auth::user();

        return DB::transaction(function () use ($apiKey, $owner, $team) {
            $result = $this->issue(
                $apiKey->name,
                $apiKey->abilities ?? [],
                $apiKey->expires_at,
                $apiKey->environment,
                $owner,
                $apiKey->team_id ?? $team->id,
            );

            $this->revoke($apiKey);

            return $result;
        });
    }

    public function revoke(ApiKey $apiKey): void
    {
        DB::transaction(function () use ($apiKey) {
            $apiKey->personalAccessToken?->delete();
            $apiKey->delete();
        });
    }

    private function issue(string $name, array $abilities, ?\DateTimeInterface $expiresAt, string $environment, User $user, int $teamId): array
    {
        return DB::transaction(function () use ($name, $abilities, $expiresAt, $environment, $user, $teamId) {
            [$model, $plain] = ApiKey::generate($name, $abilities, $expiresAt, $user->id, $environment, $teamId);

            $tokenClass = Sanctum::$personalAccessTokenModel;
            $token = new $tokenClass;
            $token->forceFill([
                'tokenable_type' => $user->getMorphClass(),
                'tokenable_id' => $user->getKey(),
                'team_id' => $teamId,
                'name' => "{$name} ({$environment} API key)",
                'token' => hash('sha256', $plain),
                'abilities' => $abilities,
                'expires_at' => $expiresAt,
            ])->save();

            $model->forceFill(['personal_access_token_id' => $token->getKey()])->save();

            return ['api_key' => $model, 'plain_text_key' => $plain];
        });
    }

    public function updateAbilities(ApiKey $apiKey, array $abilities): ApiKey
    {
        $abilities = ApiAbilities::normalize($abilities);

        return DB::transaction(function () use ($apiKey, $abilities) {
            $apiKey->update(['abilities' => $abilities]);
            $apiKey->personalAccessToken?->forceFill(['abilities' => $abilities])->save();

            return $apiKey->refresh();
        });
    }
}
