<?php

namespace App\Services\Billing;

use App\Models\User;

/**
 * Envía el correo "Payment confirmed" (plantilla React Email: emails/payment-confirmed.tsx).
 *
 * $props = name, planName, interval, amount, transactionId, authorizationCode, date, appName
 *
 * PENDIENTE de conectar con el mismo mecanismo que usa tu correo "VerifyEmail"
 * (render de React Email + envío por Resend). Mientras no esté conectado lanza una
 * excepción a propósito: NuveiGateway la reporta, nunca deshace el cobro, y así no
 * pasa desapercibido que falta el correo que Nuvei exige.
 */
class PaymentConfirmationNotifier
{
    public function send(User $user, array $props): void
    {
        throw new \LogicException('PaymentConfirmationNotifier is not wired to the React Email / Resend pipeline yet.');
    }
}