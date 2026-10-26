<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;

class StorageSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manage-settings') ?? false;
    }

    public function rules(): array
    {
        return [
            'driver' => ['required', 'in:local,s3,r2,spaces,gcs,backblaze,azure'],
            'key' => ['nullable', 'string'],
            'secret' => ['nullable', 'string'],
            'region' => ['nullable', 'string'],
            'bucket' => ['nullable', 'string'],
            'endpoint' => ['nullable', 'string'],
            'url' => ['nullable', 'url'],
            'use_path_style_endpoint' => ['boolean'],
        ];
    }
}
