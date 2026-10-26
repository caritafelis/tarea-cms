<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Fortify\CreateNewUser;
use App\Actions\Fortify\ResetUserPassword;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Registro y recuperación de contraseña por CÓDIGO (6 dígitos) para la app.
 * Requiere en AuthController: cambiar `private function issueToken` y `userPayload` a `protected`.
 * Reutiliza las acciones de Fortify (CreateNewUser / ResetUserPassword): mismas reglas de contraseña que la web.
 */
class AccountController extends AuthController
{
    private const CODE_TTL_MINUTES = 10;

    public function register(Request $request): JsonResponse
    {
        $request->validate(['device_name' => ['required', 'string', 'max:100']]);

        $user = app(CreateNewUser::class)->create($request->only('name', 'email', 'password', 'password_confirmation'));
        event(new Registered($user));

        return $this->sessionOrOnboarding($user, $request->string('device_name'));
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'email']]);
        $email = Str::lower($data['email']);

        $limiter = 'pwd-code-send:'.$email.'|'.$request->ip();
        if (RateLimiter::tooManyAttempts($limiter, 3)) {
            throw ValidationException::withMessages(['email' => [__('Too many requests. Try again later.')]])->status(429);
        }
        RateLimiter::hit($limiter, 600);

        if ($user = User::where('email', $email)->first()) {
            $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            Cache::put($this->codeKey($email), ['hash' => Hash::make($code), 'attempts' => 0], now()->addMinutes(self::CODE_TTL_MINUTES));

            Mail::raw(
                __('Your verification code is :code. It expires in :min minutes.', ['code' => $code, 'min' => self::CODE_TTL_MINUTES]),
                fn ($m) => $m->to($user->email)->subject(__('Your verification code')),
            );
        }

        // Misma respuesta exista o no el correo (sin enumeración de usuarios).
        return response()->json(['message' => __('If the email exists, a verification code was sent.')]);
    }

    public function verifyResetCode(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'email'], 'code' => ['required', 'digits:6']]);
        $email = Str::lower($data['email']);
        $key = $this->codeKey($email);
        $entry = Cache::get($key);

        if (! $entry || $entry['attempts'] >= 5 || ! Hash::check($data['code'], $entry['hash'])) {
            if ($entry) {
                $entry['attempts']++;
                Cache::put($key, $entry, now()->addMinutes(self::CODE_TTL_MINUTES));
            }

            throw ValidationException::withMessages(['code' => [__('The code is invalid or has expired.')]]);
        }

        Cache::forget($key); // el código es de un solo uso
        $token = Str::random(64);
        Cache::put('pwd-reset-token:'.hash('sha256', $token), $email, now()->addMinutes(self::CODE_TTL_MINUTES));

        return response()->json(['reset_token' => $token]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'reset_token' => ['required', 'string', 'size:64'],
            'password' => ['required', 'string'],
            'password_confirmation' => ['required', 'string'],
        ]);

        $email = Cache::pull('pwd-reset-token:'.hash('sha256', $data['reset_token']));
        $user = $email ? User::where('email', $email)->first() : null;

        if (! $user) {
            throw ValidationException::withMessages(['password' => [__('The reset session expired. Start again.')]]);
        }

        app(ResetUserPassword::class)->reset($user, $data);
        $user->tokens()->delete(); // cierra todas las sesiones abiertas
        event(new PasswordReset($user));

        return response()->json(['message' => __('Your password has been reset.')]);
    }

    /** Devuelve la sesión; si el usuario aún no tiene equipo (onboarding web pendiente) lo indica. */
    protected function sessionOrOnboarding(User $user, string $deviceName): JsonResponse
    {
        $response = $this->issueToken($user, $deviceName);

        if ($response->getStatusCode() === 403 && ($response->getData(true)['code'] ?? null) === 'no_team') {
            return response()->json([
                'code' => 'onboarding_required',
                'message' => __('Finish setting up your workspace on the web.'),
            ], 201);
        }

        return $response;
    }

    private function codeKey(string $email): string
    {
        return 'pwd-reset-code:'.hash('sha256', $email);
    }
}
