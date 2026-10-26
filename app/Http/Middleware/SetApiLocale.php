<?php

namespace App\Http\Middleware;

use App\Models\Setting;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetApiLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        $availableLocales = Setting::get('localization.active_locales', ['en']);

        $defaultLocale = (string) Setting::get('localization.default_locale', 'en');

        if (is_string($availableLocales)) {
            $availableLocales = json_decode($availableLocales, true) ?? ['en'];
        }

        if (! is_array($availableLocales) || $availableLocales === []) {
            $availableLocales = ['en'];
        }

        $availableLocales = array_values(array_filter($availableLocales, static fn ($locale): bool => is_string($locale) && $locale !== ''));

        if ($availableLocales === []) {
            $availableLocales = ['en'];
        }

        $locale = $request->route('locale') ?? $request->query('locale') ?? $request->header('X-Locale') ?? $request->header('Accept-Language') ?? $defaultLocale;

        if (is_string($locale) && str_contains($locale, ',')) {
            $locale = trim(explode(',', $locale, 2)[0]);
        }

        if (is_string($locale) && str_contains($locale, '-')) {
            $locale = strtolower(explode('-', $locale, 2)[0]);
        }

        $locale = strtolower(trim((string) $locale));

        if (! in_array($locale, $availableLocales, true)) {
            $locale = $defaultLocale;
        }

        if (! in_array($locale, $availableLocales, true)) {
            $locale = $availableLocales[0];
        }

        app()->setLocale($locale);

        $request->attributes->set('locale', $locale);

        return $next($request);
    }
}