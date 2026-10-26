<?php

namespace App\Support;

use App\Models\Setting;

class ContentLocales
{
    /** @return array<int, string> */
    public static function active(): array
    {
        $raw = Setting::get('localization.locales', Setting::get('localization.active_locales', ['en']));

        if (is_string($raw)) {
            $raw = json_decode($raw, true);
        }

        $locales = array_values(array_filter(is_array($raw) ? $raw : [], 'is_string'));

        return $locales ?: ['en'];
    }

    public static function default(): string
    {
        return (string) Setting::get('localization.default_locale', 'en');
    }
}