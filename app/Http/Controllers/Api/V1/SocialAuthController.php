<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\User;
use Firebase\JWT\JWK;
use Firebase\JWT\JWT;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

/**
 * Login / registro con Google y Apple a partir del id_token que entrega el SDK nativo.
 * Requiere: composer require firebase/php-jwt
 * config/services.php:
 *   'google' => ['client_ids' => array_filter(explode(',', env('GOOGLE_CLIENT_IDS', '')))],
 *   'apple'  => ['client_ids' => array_filter(explode(',', env('APPLE_CLIENT_IDS', '')))],   // bundle id / Services ID
 */
class SocialAuthController extends AccountController
{
    public function __invoke(Request $request, string $provider): JsonResponse
    {
        abort_unless(in_array($provider, ['google', 'apple'], true), 404);

        $data = $request->validate([
            'id_token' => ['required', 'string'],
            'device_name' => ['required', 'string', 'max:100'],
            'name' => ['nullable', 'string', 'max:255'],
        ]);

        $claims = $provider === 'google' ? $this->verifyGoogle($data['id_token']) : $this->verifyApple($data['id_token']);
        $email = Str::lower($claims['email']);

        $user = User::where('email', $email)->first();

        if (! $user) {
            $user = new User(['name' => $data['name'] ?? $claims['name'] ?? Str::before($email, '@'), 'email' => $email]);
            $user->forceFill(['password' => Hash::make(Str::random(40)), 'email_verified_at' => now()])->save();
            event(new Registered($user));
        }

        // Si el usuario tiene 2FA, el reto sigue aplicando: se pide el código igual que en el login normal.
        if ($user->hasEnabledTwoFactorAuthentication()) {
            $challenge = Str::random(64);
            Cache::put('mobile-2fa-challenge:'.hash('sha256', $challenge), $user->getKey(), now()->addMinutes(5));

            return response()->json(['two_factor' => true, 'challenge' => $challenge]);
        }

        return $this->sessionOrOnboarding($user, $data['device_name']);
    }

    private function verifyGoogle(string $idToken): array
    {
        $res = Http::get('https://oauth2.googleapis.com/tokeninfo', ['id_token' => $idToken]);
        $c = $res->json() ?? [];

        abort_unless(
            $res->ok()
            && in_array($c['aud'] ?? null, config('services.google.client_ids', []), true)
            && filter_var($c['email_verified'] ?? false, FILTER_VALIDATE_BOOLEAN)
            && ! empty($c['email']),
            401,
            'Invalid Google token.',
        );

        return $c;
    }

    private function verifyApple(string $idToken): array
    {
        try {
            $keys = Cache::remember('apple-jwks', 3600, fn () => Http::get('https://appleid.apple.com/auth/keys')->throw()->json());
            $c = (array) JWT::decode($idToken, JWK::parseKeySet($keys));
        } catch (\Throwable) {
            abort(401, 'Invalid Apple token.');
        }

        abort_unless(
            ($c['iss'] ?? '') === 'https://appleid.apple.com'
            && in_array($c['aud'] ?? '', config('services.apple.client_ids', []), true)
            && ! empty($c['email']),
            401,
            'Invalid Apple token.',
        );

        return $c;
    }
}
