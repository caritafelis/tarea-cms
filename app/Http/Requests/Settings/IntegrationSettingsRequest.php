<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;

class IntegrationSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manage-settings') ?? false;
    }

    public function rules(): array
    {
        // Generic: each integration posts its own key/value credential set.
        return [
            'provider' => ['required', 'string', 'in:stripe,paypal,openai,anthropic,google_analytics,gtm,facebook_pixel,meta_capi,resend,posthog,slack,discord'],
            'credentials' => ['required', 'array'],
            'enabled' => ['boolean'],
        ];
    }
}
