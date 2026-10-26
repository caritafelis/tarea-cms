<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;

class SecuritySettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manage-settings') ?? false;
    }

    public function rules(): array
    {
        return [
            'cors_allowed_origins' => ['nullable', 'array'],
            'cors_allowed_origins.*' => ['string'],
            'password_min_length' => ['required', 'integer', 'min:8', 'max:128'],
            'password_require_uppercase' => ['boolean'],
            'password_require_number' => ['boolean'],
            'password_require_symbol' => ['boolean'],
            'two_factor_enabled' => ['boolean'],
            'session_lifetime_minutes' => ['required', 'integer', 'min:5'],
            'trusted_proxies' => ['nullable', 'string'],
            'rate_limit_per_minute' => ['required', 'integer', 'min:1'],
        ];
    }
}
