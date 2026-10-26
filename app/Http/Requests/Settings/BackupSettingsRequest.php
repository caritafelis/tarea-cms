<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;

class BackupSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manage-settings') ?? false;
    }

    public function rules(): array
    {
        return [
            'destination' => ['required', 'in:local,s3,r2,spaces,gcs'],
            'schedule' => ['required', 'in:disabled,daily,weekly,monthly'],
            'retention_days' => ['required', 'integer', 'min:1'],
        ];
    }
}
