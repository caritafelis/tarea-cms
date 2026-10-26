<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;

class AdvancedSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manage-settings') ?? false;
    }

    public function rules(): array
    {
        return [
            'app_name' => ['required', 'string', 'max:120'],
            'app_url' => ['required', 'url'],
            'app_env' => ['required', 'in:local,staging,production'],
            'cache_driver' => ['required', 'in:redis,file,database,memcached'],
            'queue_connection' => ['required', 'in:redis,database,sync,sqs'],
            'log_channel' => ['required', 'string'],
            'debug' => ['boolean'],
            'maintenance_mode' => ['boolean'],
        ];
    }
}
