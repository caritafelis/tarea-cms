<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LanguageController extends Controller
{
    // All supported ISO 639-1 languages (label => code)
    public const SUPPORTED_LANGUAGES = [
        'en' => 'English',
        'es' => 'Spanish',
        'fr' => 'French',
        'de' => 'German',
        'it' => 'Italian',
        'pt' => 'Portuguese',
        'nl' => 'Dutch',
        'ru' => 'Russian',
        'zh' => 'Chinese',
        'ja' => 'Japanese',
        'ko' => 'Korean',
        'ar' => 'Arabic',
    ];

    public function index(string $current_team): Response
    {
        $locales = json_decode(Setting::get('locales', '["en"]'), true) ?? ['en'];
        $defaultLocale = Setting::get('default_locale', 'en');

        return Inertia::render('admin/languages/index', [
            'activeLocales' => $locales,
            'defaultLocale' => $defaultLocale,
            'supportedLanguages' => self::SUPPORTED_LANGUAGES,
        ]);
    }

    public function update(Request $request, string $current_team): RedirectResponse
    {
        $request->validate([
            'locales' => 'required|array|min:1',
            'locales.*' => 'string|in:'.implode(',', array_keys(self::SUPPORTED_LANGUAGES)),
            'default_locale' => 'required|string|in:'.implode(',', array_keys(self::SUPPORTED_LANGUAGES)),
        ]);

        $locales = $request->locales;

        // Default locale must be in active locales
        if (! in_array($request->default_locale, $locales)) {
            $locales[] = $request->default_locale;
        }

        Setting::set('locales', json_encode(array_values($locales)));
        Setting::set('default_locale', $request->default_locale);

        return redirect()->route('admin.languages.index', ['current_team' => $current_team])->with('success', 'Language settings updated.');
    }
}
