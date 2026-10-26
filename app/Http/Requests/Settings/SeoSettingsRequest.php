<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;

class SeoSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manage-settings') ?? false;
    }

    public function rules(): array
    {
        return [
            'meta_title' => ['nullable', 'string', 'max:70'],
            'meta_description' => ['nullable', 'string', 'max:160'],
            'keywords' => ['nullable', 'string', 'max:255'],
            'robots' => ['nullable', 'string', 'max:2000'],
            'canonical_url' => ['nullable', 'url'],
            'og_image' => ['nullable', 'image', 'max:4096'],
            'twitter_card_type' => ['nullable', 'in:summary,summary_large_image'],
            'json_ld' => ['nullable', 'json'],
        ];
    }
}
