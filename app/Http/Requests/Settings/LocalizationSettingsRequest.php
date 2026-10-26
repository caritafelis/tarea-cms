<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;

class LocalizationSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manage-settings') ?? false;
    }

    public function rules(): array
    {
        return [
            'default_locale' => ['required', 'string', 'size:2'],
            'active_locales' => ['required', 'array', 'min:1'],
            'active_locales.*' => ['string', 'size:2'],
            'timezone' => ['required', 'string', 'timezone'],
            'first_day_of_week' => ['required', 'integer', 'between:0,6'],
            'rtl_support' => ['boolean'],
        ];
    }
}
