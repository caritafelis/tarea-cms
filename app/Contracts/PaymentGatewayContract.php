<?php

namespace App\Contracts;

use App\Models\Plan;
use App\Models\Subscription;
use App\Models\SubscriptionPaymentMethod;
use App\Models\User;

/**
 * Cualquier proveedor de pago (Stripe, PayPal, Nuvei, el que sea mañana)
 * implementa esto. BillingController y BillingService solo hablan con
 * esta interfaz, nunca con el SDK de un proveedor en particular.
 */
interface PaymentGatewayContract
{
    /**
     * Identificador corto: "stripe" | "paypal" | "nuvei".
     */
    public function name(): string;

    /**
     * Devuelve la URL a la que hay que redirigir al usuario para
     * pagar/suscribirse (checkout hospedado por el gateway).
     */
    public function createCheckoutUrl(User $user, Plan $plan): string;

    /**
     * Cambia de plan una suscripción ya activa (upgrade/downgrade).
     */
    public function swapPlan(Subscription $subscription, Plan $plan): Subscription;

    /**
     * Cancela al final del periodo actual (deja de renovar).
     */
    public function cancel(Subscription $subscription): Subscription;

    /**
     * Reactiva una suscripción que estaba en período de gracia.
     */
    public function resume(Subscription $subscription): Subscription;

    /**
     * Adjunta un método de pago nuevo (token generado en el frontend
     * por el SDK JS del gateway) y lo guarda localmente.
     */
    public function attachPaymentMethod(User $user, string $gatewayToken, ?string $cardholderName = null): SubscriptionPaymentMethod;

    public function setDefaultPaymentMethod(SubscriptionPaymentMethod $method): void;

    public function deletePaymentMethod(SubscriptionPaymentMethod $method): void;

    /**
     * Trae las facturas más recientes del gateway y las guarda/actualiza
     * en la tabla local "invoices" (para no depender de la API en cada
     * carga de la pantalla de Billing).
     */
    public function syncInvoices(User $user): void;
}