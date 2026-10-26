<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Cpt;
use App\Models\Page;
use App\Models\Setting;
use App\Services\DynamicFieldsService;
use App\Support\ContentLocales;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PageController extends Controller
{
    public function __construct(private DynamicFieldsService $dynamicFields) {}

    private function getLocales(): array
    {
        return json_decode(Setting::get('localization.locales', '["en","es"]'), true) ?? ['en'];
    }

    private function getDefaultLocale(): string
    {
        return Setting::get('localization.default_locale', 'en');
    }

    private function transformPageForForm(Page $page): array
    {
        $locales = $this->getLocales();
        $page->load(['contentSections.cpt.allCptDefinitions', 'contentSections.values']);

        $pageData = [
            'id' => $page->id,
            'slug' => $page->slug,
            'status' => $page->status,
            'sections' => $page->dynamicFieldsFor($this->getDefaultLocale(), $locales),
        ];

        foreach ($locales as $locale) {
            $pageData["title_{$locale}"] = $page->getTranslation('title', $locale);
            $pageData["content_{$locale}"] = $page->getTranslation('content', $locale);
        }

        return $pageData;
    }

    private function getAvailableGroups()
    {
        return Cpt::active()
            ->forContentType('page')
            ->with([
                'cptDefinitions.subCpts',
                'entries:id,cpt_id,title',
                'entries.contentSections.cpt.allCptDefinitions',
                'entries.contentSections.values',
            ])
            ->orderBy('order')
            ->get()
            ->map(fn (Cpt $g) => [
                'id' => $g->id,
                'title' => $g->title,
                'slug' => $g->slug,
                'is_standalone' => $g->is_standalone,
                'standalone_label' => $g->standalone_label,
                'entries' => $g->entries
                    ->map(fn ($e) => [
                        'id' => $e->id,
                        'title' => $e->title,
                        'data' => optional($e->contentSections->firstWhere('cpt_id', $g->id))
                            ?->toStructuredData(ContentLocales::default()) ?? [],
                        'locales' => optional($e->contentSections->firstWhere('cpt_id', $g->id))
                            ?->toLocalizedData(ContentLocales::active()) ?? [],
                    ])
                    ->values(),
                'fields' => $g->cptDefinitions->map(fn ($f) => [
                    'id' => $f->id,
                    'name' => $f->name,
                    'label' => $f->label,
                    'type' => $f->type,
                    'required' => $f->required,
                    'options' => $f->options,
                    'instructions' => $f->instructions,
                    'default_value' => $f->default_value,
                    'translatable' => $f->translatable,
                    'sub_fields' => $f->subCpts->map(fn ($sf) => [
                        'id' => $sf->id,
                        'name' => $sf->name,
                        'label' => $sf->label,
                        'type' => $sf->type,
                        'required' => $sf->required,
                        'options' => $sf->options,
                    ])->values(),
                ])->values(),
            ]);
    }

    public function index(string $current_team): Response
    {
        return Inertia::render('admin/pages/index', [
            'pages' => Page::orderBy('created_at', 'desc')->get(),
            'locales' => $this->getLocales(),
            'defaultLocale' => $this->getDefaultLocale(),
            'availableGroups' => $this->getAvailableGroups(),
        ]);
    }

    public function create(string $current_team): Response
    {
        return Inertia::render('admin/pages/create', [
            'locales' => $this->getLocales(),
            'defaultLocale' => $this->getDefaultLocale(),
            'availableGroups' => $this->getAvailableGroups(),
        ]);
    }

    public function store(Request $request, string $current_team): RedirectResponse
    {
        $locales = $this->getLocales();
        $defaultLocale = $this->getDefaultLocale();

        $rules = [
            'status' => 'required|string',
            'slug' => 'nullable|string|max:255|unique:pages,slug',
            'sections' => 'nullable|array',
        ];
        foreach ($locales as $locale) {
            $rules["title_{$locale}"] = $locale === $defaultLocale ? 'required|string' : 'nullable|string';
            $rules["content_{$locale}"] = 'nullable|string';
        }
        $request->validate($rules);

        $title = [];
        $content = [];
        foreach ($locales as $locale) {
            $title[$locale] = $request->input("title_{$locale}", $request->input("title_{$defaultLocale}", ''));
            $content[$locale] = $request->input("content_{$locale}", $request->input("content_{$defaultLocale}", ''));
        }

        $page = new Page;
        $page->title = $title;
        $page->content = $content;
        $page->slug = $request->filled('slug')
            ? Str::slug($request->slug)
            : null;
        $page->status = $request->status;
        $page->user_id = auth()->id();

        $page->save();

        if ($request->filled('sections')) {
            $this->dynamicFields->saveSections($page, $request->sections);
        }

        return redirect()->route('admin.pages.index', ['current_team' => $current_team])->with('success', 'Page created successfully.');
    }

    public function edit(string $current_team, Page $page): Response
    {
        return Inertia::render('admin/pages/edit', [
            'page' => $this->transformPageForForm($page),
            'locales' => $this->getLocales(),
            'defaultLocale' => $this->getDefaultLocale(),
            'availableGroups' => $this->getAvailableGroups(),
        ]);
    }

    public function editData(string $current_team, Page $page): JsonResponse
    {
        return response()->json([
            'page' => $this->transformPageForForm($page),
        ]);
    }

    public function update(Request $request, string $current_team, Page $page): RedirectResponse
    {
        $locales = $this->getLocales();
        $defaultLocale = $this->getDefaultLocale();

        $rules = [
            'status' => 'required|string',
            'slug' => 'nullable|string|max:255|unique:pages,slug,'.$page->id,
            'sections' => 'nullable|array',
        ];
        foreach ($locales as $locale) {
            $rules["title_{$locale}"] = $locale === $defaultLocale ? 'required|string' : 'nullable|string';
            $rules["content_{$locale}"] = 'nullable|string';
        }
        $request->validate($rules);

        $title = [];
        $content = [];
        foreach ($locales as $locale) {
            $title[$locale] = $request->input("title_{$locale}", $page->getTranslation('title', $locale));
            $content[$locale] = $request->input("content_{$locale}", $page->getTranslation('content', $locale));
        }

        $page->title = $title;
        $page->content = $content;
        if ($request->filled('slug')) {
            $page->slug = Str::slug($request->slug);
        }
        $page->status = $request->status;
        $page->save();

        $this->dynamicFields->saveSections($page, $request->sections ?? []);

        return redirect()->route('admin.pages.index', ['current_team' => $current_team])->with('success', 'Page updated successfully.');
    }

    public function destroy(string $current_team, Page $page): RedirectResponse
    {
        $page->contentSections->each(fn ($s) => $s->values()->delete());
        $page->contentSections()->delete();
        $page->delete();

        return redirect()->route('admin.pages.index', ['current_team' => $current_team])->with('success', 'Page deleted successfully.');
    }
}