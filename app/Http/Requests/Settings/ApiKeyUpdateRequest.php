<?php

namespace App\Http\Requests\Settings;

use Illuminate\Support\Arr;

class ApiKeyUpdateRequest extends ApiKeyStoreRequest
{
    public function rules(): array
    {
        return Arr::only(parent::rules(), ['abilities', 'abilities.*']);
    }

    protected function environment(): ?string
    {
        return $this->route('apiKey')?->environment;
    }
}