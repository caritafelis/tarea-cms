<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\PasswordUpdateRequest;
use App\Http\Requests\Settings\TwoFactorAuthenticationRequest;
use App\Mail\PasswordChangeCodeMail;
use App\Services\Settings\SessionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Fortify\Features;

/**
 * Vive dentro del grupo de rutas del current team:
 *   /{current_team}/settings/security/...
 * (ver APPLY.md para el bloque de rutas).
 */
class SecurityController extends Controller
{
    private const CODE_TTL_MINUTES = 10;

    private const RESEND_COOLDOWN_SECONDS = 30;

    private const MAX_ATTEMPTS = 5;

    private const VERIFIED_FOR_MINUTES = 10;

    public function __construct(private readonly SessionService $sessions) {}

    /**
     * Show the user's security settings page.
     */
    public function edit(TwoFactorAuthenticationRequest $request): Response
    {
        $props = [
            'canManageTwoFactor' => Features::canManageTwoFactorAuthentication(),

            'canManagePasskeys' => Features::canManagePasskeys(),

            'passkeys' => Features::canManagePasskeys()
                ? $request->user()
                    ->passkeys()
                    ->select(['id', 'name', 'credential', 'created_at', 'last_used_at'])
                    ->latest()
                    ->get()
                    ->map(fn ($passkey) => [
                        'id' => $passkey->id,
                        'name' => $passkey->name,
                        'authenticator' => $passkey->authenticator,
                        'created_at_diff' => $passkey->created_at->diffForHumans(),
                        'last_used_at_diff' => $passkey->last_used_at?->diffForHumans(),
                    ])
                    ->values()
                    ->all()
                : [],

            'passwordRules' => Password::defaults()->toPasswordRulesString(),

            // "Browsers and devices"
            'sessions' => $this->sessions->forUser(),
        ];

        if (Features::canManageTwoFactorAuthentication()) {
            $request->ensureStateIsValid();

            $props['twoFactorEnabled'] = $request->user()->hasEnabledTwoFactorAuthentication();

            $props['requiresConfirmation'] = Features::optionEnabled(
                Features::twoFactorAuthentication(),
                'confirm'
            );
        }

        return Inertia::render('settings/security', $props);
    }

    /**
     * Send OTP code to email.
     */
    public function sendPasswordChangeCode(Request $request): JsonResponse
    {
        $user = $request->user();

        if (Cache::has("password-change:cooldown:{$user->id}")) {
            return response()->json([
                'message' => __('Please wait before requesting another code.'),
            ], 429);
        }

        $code = (string) random_int(100000, 999999);

        // Se guarda hasheado: aunque alguien lea la cache, no ve el código.
        Cache::put("password-change:{$user->id}", Hash::make($code), now()->addMinutes(self::CODE_TTL_MINUTES));
        Cache::forget("password-change:attempts:{$user->id}");
        Cache::put("password-change:cooldown:{$user->id}", true, now()->addSeconds(self::RESEND_COOLDOWN_SECONDS));

        Mail::to($user)->send(new PasswordChangeCodeMail(user: $user, code: $code));

        return response()->json(['message' => __('Verification code sent.')]);
    }

    /**
     * Verify OTP code.
     */
    public function verifyPasswordChangeCode(Request $request): JsonResponse
    {
        $request->validate(['code' => ['required', 'digits:6']]);

        $user = $request->user();
        $codeKey = "password-change:{$user->id}";
        $attemptsKey = "password-change:attempts:{$user->id}";

        // Un código de 6 dígitos sin límite de intentos se puede forzar: máximo 5.
        if ((int) Cache::get($attemptsKey, 0) >= self::MAX_ATTEMPTS) {
            Cache::forget($codeKey);

            return response()->json([
                'message' => __('Too many attempts. Request a new code.'),
            ], 429);
        }

        $hash = Cache::get($codeKey);

        if (! $hash || ! Hash::check($request->string('code')->toString(), $hash)) {
            Cache::add($attemptsKey, 0, now()->addMinutes(self::CODE_TTL_MINUTES));
            Cache::increment($attemptsKey);

            return response()->json(['message' => __('Invalid code.')], 422);
        }

        Cache::forget($codeKey);
        Cache::forget($attemptsKey);

        session([
            // BUG CORREGIDO: antes se guardaba "password_change_verified" = true
            // pero update() leía "password_change_verified_until" (nunca definido),
            // así que cambiar la contraseña siempre devolvía 403.
            'password_change_verified_until' => now()->addMinutes(self::VERIFIED_FOR_MINUTES)->timestamp,
            // Permite además las rutas de Fortify protegidas con password.confirm
            // (activar/desactivar 2FA, regenerar códigos).
            'auth.password_confirmed_at' => time(),
        ]);

        return response()->json(['verified' => true]);
    }

    /**
     * Update the user's password.
     */
    public function update(PasswordUpdateRequest $request): RedirectResponse
    {
        abort_unless(
            (int) session('password_change_verified_until', 0) > time(),
            403,
            __('Password verification required.')
        );

        $request->user()->update(['password' => $request->password]);

        session()->forget('password_change_verified_until');

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Password updated.'),
        ]);

        return back();
    }

    /**
     * Cancel password change verification.
     */
    public function cancelPasswordChangeVerification(Request $request): JsonResponse
    {
        $user = $request->user();

        session()->forget('password_change_verified_until');

        Cache::forget("password-change:{$user->id}");
        Cache::forget("password-change:attempts:{$user->id}");

        return response()->json(['cancelled' => true]);
    }

    /**
     * Revoke a signed-in browser/device.
     * Se lee de la ruta por nombre para que funcione aunque el prefijo
     * {current_team} no se haya "olvidado" en el middleware del team.
     */
    public function destroySession(Request $request): RedirectResponse
    {
        $this->sessions->revoke((string) $request->route('sessionId'));

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Session signed out.'),
        ]);

        return back();
    }
}
