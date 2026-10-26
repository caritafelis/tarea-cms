<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Cpt;
use App\Models\CptEntry;
use App\Models\Team;
use App\Services\DynamicFieldsService;
use App\Support\ContentLocales;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CptEntryController extends Controller
{
    public function __construct(private DynamicFieldsService $dynamicFields) {}

    public function index(
        Team $current_team,
        Cpt $cpt
    ): Response {
        abort_unless($cpt->is_standalone, 404);

        $entries = $cpt->entries()
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('admin/cpt/index', [
            'current_team' => $current_team->slug,
            'cpt' => [
                'id' => $cpt->id,
                'title' => $cpt->title,
                'slug' => $cpt->slug,
                'standalone_label' => $cpt->standalone_label,
                'standalone_icon' => $cpt->standalone_icon,
            ],
            'entries' => $entries->map(fn ($e) => [
                'id' => $e->id,
                'title' => $e->title,
                'slug' => $e->slug,
                'status' => $e->status,
                'created_at' => $e->created_at,
            ]),
        ]);
    }

    public function create(
        Team $current_team,
        Cpt $cpt
    ): Response {
        abort_unless($cpt->is_standalone, 404);

        return Inertia::render('admin/cpt/edit', [
            'current_team' => $current_team->slug,
            'cpt' => $this->formatGroup($cpt),
            'entry' => null,
            'locales' => ContentLocales::active(),
            'defaultLocale' => ContentLocales::default(),
        ]);
    }

    public function store(
        Request $request,
        Team $current_team,
        Cpt $cpt
    ): RedirectResponse {
        abort_unless($cpt->is_standalone, 404);

        $request->validate([
            'title' => 'required|string|max:255',
            'status' => 'required|string|in:draft,published',
            'sections' => 'nullable|array',
        ]);

        $entry = CptEntry::create([
            'cpt_id' => $cpt->id,
            'title' => $request->title,
            'status' => $request->status,
        ]);

        if ($request->filled('sections')) {
            $this->dynamicFields->saveSections(
                $entry,
                $request->sections
            );
        }

        return redirect()
            ->route('admin.cpt.entries.index', [
                'current_team' => $current_team->slug,
                'cpt' => $cpt->slug,
            ])
            ->with('success', 'Entry created.');
    }

    public function edit(
        Team $current_team,
        Cpt $cpt,
        CptEntry $entry
    ): Response {
        abort_unless($cpt->is_standalone, 404);
        abort_unless($entry->cpt_id === $cpt->id, 404);

        $entry->load([
            'contentSections.cpt.allCptDefinitions',
            'contentSections.values',
        ]);

        return Inertia::render('admin/cpt/edit', [
            'current_team' => $current_team->slug,
            'cpt' => $this->formatGroup($cpt),
            'entry' => [
                'id' => $entry->id,
                'title' => $entry->title,
                'slug' => $entry->slug,
                'status' => $entry->status,
                'sections' => collect(
                    $entry->dynamicFieldsFor(
                        ContentLocales::default(), 
                        ContentLocales::active()
                    )
                ),
            ],
            'locales' => ContentLocales::active(),
            'defaultLocale' => ContentLocales::default(),
        ]);
    }

    public function update(
        Request $request,
        Team $current_team,
        Cpt $cpt,
        CptEntry $entry
    ): RedirectResponse {
        abort_unless($cpt->is_standalone, 404);
        abort_unless($entry->cpt_id === $cpt->id, 404);

        $request->validate([
            'title' => 'required|string|max:255',
            'status' => 'required|string|in:draft,published',
            'sections' => 'nullable|array',
        ]);

        $entry->update([
            'title' => $request->title,
            'status' => $request->status,
        ]);

        $this->dynamicFields->saveSections(
            $entry,
            $request->sections ?? []
        );

        return redirect()
            ->back()
            ->with('success', 'Entry updated.');
    }

    public function destroy(
        Team $current_team,
        Cpt $cpt,
        CptEntry $entry
    ): RedirectResponse {
        abort_unless(
            $entry->cpt_id === $cpt->id,
            404
        );

        $entry->contentSections
            ->each(fn ($section) => $section->values()->delete());

        $entry->contentSections()->delete();

        $entry->delete();

        return redirect()
            ->back()
            ->with('success', 'Entry deleted.');
    }

    private function formatGroup(
        Cpt $cpt
    ): array {
        $cpt->load('cptDefinitions.subCpts');

        return [
            'id' => $cpt->id,
            'title' => $cpt->title,
            'slug' => $cpt->slug,
            'standalone_label' => $cpt->standalone_label,
            'translatable' => $f->translatable,
            'fields' => $cpt->cptDefinitions->map(fn ($f) => [
                'id' => $f->id,
                'name' => $f->name,
                'label' => $f->label,
                'type' => $f->type,
                'required' => $f->required,
                'options' => $f->options,
                'instructions' => $f->instructions,
                'default_value' => $f->default_value,
                'sub_fields' => $f->subCpts->map(fn ($sf) => [
                    'id' => $sf->id,
                    'name' => $sf->name,
                    'label' => $sf->label,
                    'type' => $sf->type,
                    'required' => $sf->required,
                    'options' => $sf->options,
                    'translatable' => $sf->translatable
                ])->values(),
            ])->values(),
        ];
    }
}
