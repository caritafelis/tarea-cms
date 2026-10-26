<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Cpt;
use App\Models\Post;
use App\Models\Setting;
use App\Services\DynamicFieldsService;
use App\Support\ContentLocales;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PostController extends Controller
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

    private function transformPostForForm(Post $post): array
    {
        $locales = $this->getLocales();
        $post->load(['contentSections.cpt.allCptDefinitions', 'contentSections.values']);

        $postData = [
            'id' => $post->id,
            'slug' => $post->slug,
            'status' => $post->status,
            'sections' => $post->dynamicFieldsFor($this->getDefaultLocale(), $locales),
        ];

        foreach ($locales as $locale) {
            $postData["title_{$locale}"] = $post->getTranslation('title', $locale);
            $postData["content_{$locale}"] = $post->getTranslation('content', $locale);
        }

        return $postData;
    }

    private function getAvailableGroups()
    {
        return Cpt::active()
            ->forContentType('post')
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
        return Inertia::render('admin/posts/index', [
            'posts' => Post::orderBy('created_at', 'desc')->get(),
            'locales' => $this->getLocales(),
            'defaultLocale' => $this->getDefaultLocale(),
            'availableGroups' => $this->getAvailableGroups(),
        ]);
    }

    public function create(string $current_team): Response
    {
        return Inertia::render('admin/posts/create', [
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
            'slug' => 'nullable|string|max:255|unique:posts,slug',
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

        $post = new Post;
        $post->title = $title;
        $post->content = $content;
        $post->slug = $request->filled('slug')
            ? Str::slug($request->slug)
            : null;
        $post->status = $request->status;
        $post->user_id = auth()->id();

        if ($request->status === 'published') {
            $post->published_at = now();
        }

        $post->save();

        if ($request->filled('sections')) {
            $this->dynamicFields->saveSections($post, $request->sections);
        }

        return redirect()->route('admin.posts.index', ['current_team' => $current_team])->with('success', 'Post created successfully.');
    }

    public function edit(string $current_team, Post $post): Response
    {
        return Inertia::render('admin/posts/edit', [
            'post' => $this->transformPostForForm($post),
            'locales' => $this->getLocales(),
            'defaultLocale' => $this->getDefaultLocale(),
            'availableGroups' => $this->getAvailableGroups(),
        ]);
    }

    public function editData(string $current_team, Post $post): JsonResponse
    {
        return response()->json([
            'post' => $this->transformPostForForm($post),
        ]);
    }

    public function update(Request $request, string $current_team, Post $post): RedirectResponse
    {
        $locales = $this->getLocales();
        $defaultLocale = $this->getDefaultLocale();

        $rules = [
            'status' => 'required|string',
            'slug' => 'nullable|string|max:255|unique:posts,slug,'.$post->id,
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
            $title[$locale] = $request->input("title_{$locale}", $post->getTranslation('title', $locale));
            $content[$locale] = $request->input("content_{$locale}", $post->getTranslation('content', $locale));
        }

        $post->title = $title;
        $post->content = $content;

        if ($request->filled('slug')) {
            $post->slug = Str::slug($request->slug);
        }

        $post->status = $request->status;

        if ($request->status === 'published' && ! $post->published_at) {
            $post->published_at = now();
        }

        $post->save();

        $this->dynamicFields->saveSections($post, $request->sections ?? []);

        return redirect()->route('admin.posts.index', ['current_team' => $current_team])->with('success', 'Post updated successfully.');
    }

    public function destroy(string $current_team, Post $post): RedirectResponse
    {
        $post->contentSections->each(fn ($s) => $s->values()->delete());
        $post->contentSections()->delete();
        $post->delete();

        return redirect()->route('admin.posts.index', ['current_team' => $current_team])->with('success', 'Post deleted successfully.');
    }
}