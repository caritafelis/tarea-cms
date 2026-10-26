<?php

namespace App\Http\Requests\Settings;

use App\Services\Settings\MailProviderRegistry;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EmailSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Las reglas de "credentials.*" cambian según el mailer elegido:
     * si es Postmark solo se exige "token"; si es SMTP se exigen
     * host/port/username/password/encryption; si es "log" o
     * "sendmail" no se exige nada.
     */
    public function rules(): array
    {
        /** @var MailProviderRegistry $registry */
        $registry = app(MailProviderRegistry::class);
        $mailer = (string) $this->input('mailer', 'smtp');

        $rules = [
            'mailer' => ['required', 'string', Rule::in(array_keys($registry->all()))],
            'from_name' => ['required', 'string', 'max:255'],
            'from_address' => ['required', 'email'],
            'credentials' => ['nullable', 'array'],
        ];

        foreach ($registry->fieldsFor($mailer) as $field) {
            $rules["credentials.{$field['key']}"] = $field['type'] === 'number'
                ? ['nullable', 'numeric']
                : ['nullable', 'string'];
        }

        return $rules;
    }
}
