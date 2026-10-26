<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Team;
use App\Models\User;
use App\Services\Auth\TeamApiTokenService;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Contracts\TwoFactorAuthenticationProvider;
use Laravel\Fortify\Events\RecoveryCodeReplaced;
use Laravel\Sanctum\PersonalAccessToken;

/**
 * Autenticación por token (Sanctum) para la app móvil. ÚNICO controlador de auth de la API.
 * Fortify sigue siendo dueño del login WEB; AccountController (registro / código de 6 dígitos)
 * y SocialAuthController heredan de aquí y reutilizan issueToken() / userPayload().
 *
 *   POST /api/auth/login               { email, password, device_name, team_id? }
 *        -> 200 { token, token_type, expires_at, user, team, teams, entitlements }
 *        -> 200 { two_factor: true, challenge }
 *        -> 403 { code: "email_unverified" | "no_team" } | 422 | 429
 *   POST /api/auth/two-factor-challenge { challenge, code | recovery_code, device_name }
 *   GET  /api/auth/me                   -> { user, team, teams, entitlements, abilities }
 *   POST /api/auth/logout               -> 204 (revoca solo el token actual)
 *   POST /api/auth/switch-team          { team_id } -> igual que login (token nuevo)
 */
class AuthController extends Controller
{
    private const TOKEN_TTL_DAYS = 30;

    private const CHALLENGE_TTL_MINUTES = 5;

    private const MAX_ATTEMPTS = 5;

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
            'device_name' => ['required', 'string', 'max:100'],
            'team_id' => ['nullable', 'integer'],
        ]);

        $key = Str::transliterate(Str::lower($data['email']).'|'.$request->ip());
        $this->ensureNotRateLimited($key, 'email');

        $user = User::where('email', $data['email'])->first();

        // Siempre se hace un hash de coste similar para no revelar por tiempo si el correo existe.
        if ($user) {
            $passwordOk = Hash::check($data['password'], (string) $user->password);
        } else {
            Hash::make($data['password']);
            $passwordOk = false;
        }

        if (! $passwordOk) {
            RateLimiter::hit($key);

            throw ValidationException::withMessages(['email' => [trans('auth.failed')]]);
        }

        RateLimiter::clear($key);

        if ($user instanceof MustVerifyEmail && ! $user->hasVerifiedEmail()) {
            return response()->json([
                'message' => __('Tu correo electrónico no está verificado.'),
                'code' => 'email_unverified',
            ], 403);
        }

        // Con 2FA NO se emite token hasta superar el reto (si no, la app se saltaría el 2FA).
        if ($user->hasEnabledTwoFactorAuthentication()) {
            $challenge = Str::random(64);
            Cache::put(
                $this->challengeCacheKey($challenge),
                ['user' => $user->getKey(), 'team' => $data['team_id'] ?? null],
                now()->addMinutes(self::CHALLENGE_TTL_MINUTES),
            );

            return response()->json(['two_factor' => true, 'challenge' => $challenge]);
        }

        return $this->issueToken($user, $data['device_name'], $data['team_id'] ?? null);
    }

    public function twoFactorChallenge(Request $request): JsonResponse
    {
        $data = $request->validate([
            'challenge' => ['required', 'string', 'size:64'],
            'code' => ['nullable', 'string', 'required_without:recovery_code'],
            'recovery_code' => ['nullable', 'string', 'required_without:code'],
            'device_name' => ['required', 'string', 'max:100'],
        ]);

        $cacheKey = $this->challengeCacheKey($data['challenge']);
        $limiterKey = 'mobile-2fa:'.hash('sha256', $data['challenge']);
        $field = isset($data['code']) ? 'code' : 'recovery_code';

        if (RateLimiter::tooManyAttempts($limiterKey, self::MAX_ATTEMPTS)) {
            Cache::forget($cacheKey); // el reto queda invalidado: hay que volver a hacer login

            throw ValidationException::withMessages([
                $field => [__('Demasiados intentos. Inicia sesión de nuevo.')],
            ])->status(429);
        }

        $cached = Cache::get($cacheKey);
        $userId = is_array($cached) ? ($cached['user'] ?? null) : $cached; // compat con retos antiguos
        $teamId = is_array($cached) ? ($cached['team'] ?? null) : null;
        $user = $userId ? User::find($userId) : null;

        if (! $user) {
            throw ValidationException::withMessages([
                $field => [__('La verificación expiró. Inicia sesión de nuevo.')],
            ]);
        }

        $valid = isset($data['code'])
            ? app(TwoFactorAuthenticationProvider::class)->verify(decrypt($user->two_factor_secret), $data['code'])
            : $this->consumeRecoveryCode($user, $data['recovery_code']);

        if (! $valid) {
            RateLimiter::hit($limiterKey, self::CHALLENGE_TTL_MINUTES * 60);

            throw ValidationException::withMessages([
                $field => [__('El código no es válido.')],
            ]);
        }

        // El reto es de un solo uso.
        Cache::forget($cacheKey);
        RateLimiter::clear($limiterKey);

        return $this->issueToken($user, $data['device_name'], $teamId);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $token = $user->currentAccessToken();

        // Las API keys (cms_live_*) no llevan equipo propio: se cae al equipo actual del usuario.
        $team = ($token->team ?? null) ?: $user->currentTeam;

        return response()->json($this->sessionPayload($user, $team) + [
            'abilities' => $token->abilities ?? ['*'],
        ]);
    }

    public function logout(Request $request): Response
    {
        $token = $request->user()->currentAccessToken();

        if ($token instanceof PersonalAccessToken) {
            $token->delete();
        }

        return response()->noContent();
    }

    public function switchTeam(Request $request, TeamApiTokenService $tokens): JsonResponse
    {
        $data = $request->validate(['team_id' => ['required', 'integer', 'exists:teams,id']]);

        $user = $request->user();
        $current = $user->currentAccessToken();
        $team = Team::findOrFail($data['team_id']);

        abort_unless($user->belongsToTeam($team), 403, 'The user does not belong to the selected team.');

        $new = $tokens->create($user, $team, $current->name, $current->abilities, $current->expires_at);

        if ($current instanceof PersonalAccessToken) {
            $current->delete();
        }

        return response()->json([
            'token' => $new->plainTextToken,
            'token_type' => 'Bearer',
            'expires_at' => $current->expires_at?->toIso8601String(),
        ] + $this->sessionPayload($user, $team));
    }

    // ------------------------------------------------------------------
    // protected: los reutilizan AccountController (registro, código de 6 dígitos) y SocialAuthController.

    protected function issueToken(User $user, string $deviceName, ?int $teamId = null): JsonResponse
    {
        // SetApiTeam exige que el token tenga equipo y que el usuario pertenezca a él.
        $team = $teamId ? Team::find($teamId) : ($user->currentTeam ?? $user->fallbackTeam());

        if (! $team || ! $user->belongsToTeam($team)) {
            return response()->json([
                'message' => __('Tu cuenta no pertenece a ningún equipo.'),
                'code' => 'no_team',
            ], 403);
        }

        $name = 'mobile:'.$deviceName;

        // Un token por dispositivo: un nuevo login del mismo dispositivo reemplaza al anterior.
        $user->tokens()->where('name', $name)->delete();

        $expiresAt = now()->addDays(self::TOKEN_TTL_DAYS);

        // personal_access_tokens.team_id es NOT NULL: el servicio inserta ya con equipo y caducidad.
        $token = app(TeamApiTokenService::class)->create($user, $team, $name, ['*'], $expiresAt);

        return response()->json([
            'token' => $token->plainTextToken,
            'token_type' => 'Bearer',
            'expires_at' => $expiresAt->toIso8601String(),
        ] + $this->sessionPayload($user, $team));
    }

    protected function userPayload(User $user, int|string|null $teamId): array
    {
        return [
            'id' => $user->getKey(),
            'name' => $user->name,
            'email' => $user->email,
            // La app solo usa esto para mostrar/ocultar UI; el backend impone los permisos igualmente.
            'role' => $user->isSuperAdmin() ? 'super_admin' : 'user',
            'team_id' => $teamId,
        ];
    }

    protected function sessionPayload(User $user, ?Team $team): array
    {
        return [
            'user' => $this->userPayload($user, $team?->getKey()),
            'team' => $team ? [
                'id' => $team->id,
                'name' => $team->name,
                'slug' => $team->slug,
                'onboarding_completed' => $team->onboarding_completed_at !== null,
            ] : null,
            'teams' => $user->userTeams()->get()->map(fn (Team $t) => [
                'id' => $t->id, 'name' => $t->name, 'slug' => $t->slug, 'is_personal' => (bool) $t->is_personal,
            ])->values(),
            'entitlements' => $team?->entitlements(),
        ];
    }

    private function consumeRecoveryCode(User $user, string $input): bool
    {
        $code = collect($user->recoveryCodes())->first(fn (string $c) => hash_equals($c, $input));

        if (! $code) {
            return false;
        }

        $user->replaceRecoveryCode($code);
        event(new RecoveryCodeReplaced($user, $code));

        return true;
    }

    private function challengeCacheKey(string $challenge): string
    {
        return 'mobile-2fa-challenge:'.hash('sha256', $challenge);
    }

    private function ensureNotRateLimited(string $key, string $field): void
    {
        if (! RateLimiter::tooManyAttempts($key, self::MAX_ATTEMPTS)) {
            return;
        }

        throw ValidationException::withMessages([
            $field => [trans('auth.throttle', [
                'seconds' => RateLimiter::availableIn($key),
                'minutes' => (int) ceil(RateLimiter::availableIn($key) / 60),
            ])],
        ])->status(429);
    }
}