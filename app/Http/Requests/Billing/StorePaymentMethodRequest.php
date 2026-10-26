<?php

namespace App\Http\Requests\Billing;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePaymentMethodRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'gateway' => ['required', 'string', Rule::in(['stripe', 'paypal', 'nuvei'])],
            // Token/id que devuelve el SDK JS del gateway en el navegador
            // (Stripe.js -> PaymentMethod id, Nuvei Simply Connect -> userPaymentOptionId,
            // PayPal -> id de la cuenta aprobada). Nunca se manda el número de tarjeta.
            'token' => ['required', 'string'],
            'name' => ['nullable', 'string', 'max:255'],
            'make_default' => ['nullable', 'boolean'],
        ];
    }
}
