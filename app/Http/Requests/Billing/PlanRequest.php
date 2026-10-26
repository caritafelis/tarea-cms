<?php

namespace App\Http\Requests\Billing;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class PlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $planId = $this->route('plan')?->id;

        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => [
                'nullable', 'string', 'max:255',
                Rule::unique('plans', 'slug')->ignore($planId),
            ],
            'has_ecommerce' => ['boolean'],
            'tier' => ['required', 'string', 'max:255'],
            'price' => ['required', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'size:3'],
            'interval' => ['required', Rule::in(['month', 'year'])],
            'gateway' => ['sometimes', 'required', Rule::in(['stripe', 'paypal', 'nuvei'])],
            'gateway_price_id' => ['prohibited'],
            'gateway_ids' => ['prohibited'],
            'features' => ['nullable', 'array'],
            'features.*.label' => ['required', 'string', 'max:255'],
            'features.*.included' => ['boolean'],
            'is_active' => ['boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if (! $this->filled('slug') && $this->filled('name')) {
            $this->merge(['slug' => Str::slug($this->input('name'))]);
        }
    }

    /** Convierte el precio en dólares/formato humano a centavos para guardar. */
    public function priceCents(): int
    {
        return (int) round(((float) $this->validated('price')) * 100);
    }
}