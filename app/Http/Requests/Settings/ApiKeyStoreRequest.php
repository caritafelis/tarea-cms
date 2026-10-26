<?php

namespace App\Http\Requests\Settings;

use App\Models\ApiKey;
use App\Support\ApiAbilities;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class ApiKeyStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manage-settings') ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'environment' => ['required', Rule::in(ApiKey::ENVIRONMENTS)],
            'abilities' => ['required', 'array', 'min:1', 'max:200'],
            'abilities.*' => ['string', function (string $attribute, mixed $value, Closure $fail) {
                if (! ApiAbilities::isValid($value)) {
                    $fail('Unknown permission: '.(is_scalar($value) ? $value : 'invalid').'.');
                }
            }],
            'expires_at' => ['nullable', 'date', 'after:now'],
        ];
    }

    protected function environment(): ?string
    {
        return $this->input('environment');
    }

    /** Test keys share the production database, so they can't be given write access by default. */
    public function after(): array
    {
        return [function (Validator $validator) {
            if ($this->environment() !== 'test' || config('settings.test_keys_can_write', false)) {
                return;
            }

            if (collect($this->input('abilities', []))->contains(fn ($a) => ApiAbilities::isWrite((string) $a))) {
                $validator->errors()->add(
                    'abilities',
                    'Test keys are read-only. Remove write permissions or create a production key.'
                );
            }
        }];
    }
}