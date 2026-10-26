<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Cpt;
use App\Models\CptDefinition;
use App\Models\Team;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CptController extends Controller
{
    private function getCurrentTeam(string $current_team): Team
    {
        return Team::where('slug', $current_team)->firstOrFail();
    }

    public function index(string $current_team): Response
    {
        $team = $this->getCurrentTeam($current_team);

        $groups = Cpt::where('team_id', $team->id)
            ->with('cptDefinitions')
            ->orderBy('content_type')
            ->orderBy('order')
            ->get()
            ->map(fn (Cpt $g) => [
                'id' => $g->id,
                'title' => $g->title,
                'slug' => $g->slug,
                'description' => $g->description,
                'content_type' => $g->content_type,
                'is_active' => $g->is_active,
                'order' => $g->order,
                'fields_count' => $g->cptDefinitions->count(),
            ]);

        return Inertia::render('admin/acf/index', [
            'groups' => $groups,
            'contentTypes' => Cpt::CONTENT_TYPES,
        ]);
    }

    public function create(string $current_team): Response
    {
        return Inertia::render('admin/acf/edit', [
            'group' => null,
            'fieldTypes' => CptDefinition::TYPES,
            'contentTypes' => Cpt::CONTENT_TYPES,
        ]);
    }

    public function store(Request $request, string $current_team): RedirectResponse
    {
        $team = $this->getCurrentTeam($current_team);

        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'content_type' => ['required', Rule::in(array_keys(Cpt::CONTENT_TYPES))],
            'is_standalone' => 'boolean',
            'standalone_label' => 'nullable|string|max:100',
            'standalone_icon' => 'nullable|string|max:50',
            'is_active' => 'boolean',
            'order' => 'integer',
            'fields' => 'array',
            'fields.*.label' => 'required|string',
            'fields.*.name' => 'required|string|alpha_dash',
            'fields.*.type' => ['required', Rule::in(CptDefinition::TYPES)],
            'fields.*.required' => 'boolean',
            'fields.*.order' => 'integer',
            'fields.*.options' => 'nullable|array',
            'fields.*.settings' => 'nullable|array',
            'fields.*.instructions' => 'nullable|string',
            'fields.*.translatable' => 'boolean',
            'fields.*.sub_fields.*.translatable' => 'boolean',
            'fields.*.sub_fields' => 'nullable|array',
            'fields.*.sub_fields.*.label' => 'required_with:fields.*.sub_fields|string',
            'fields.*.sub_fields.*.name' => 'required_with:fields.*.sub_fields|string|alpha_dash',
            'fields.*.sub_fields.*.type' => ['required_with:fields.*.sub_fields', Rule::in(CptDefinition::TYPES)],
        ]);

        $group = Cpt::create([
            'team_id' => $team->id,
            'title' => $data['title'],
            'slug' => Str::slug($data['title']),
            'description' => $data['description'] ?? null,
            'content_type' => $data['content_type'],
            'is_standalone' => $data['is_standalone'] ?? false,
            'standalone_label' => $data['standalone_label'] ?? null,
            'standalone_icon' => $data['standalone_icon'] ?? null,
            'is_active' => $data['is_active'] ?? true,
            'order' => $data['order'] ?? 0,
        ]);

        $this->saveCptDefinitions($group, $data['fields'] ?? []);

        return redirect()->route('admin.acf.index')
            ->with('success', 'Field group created.');
    }

    public function edit(string $current_team, Cpt $acf): Response
    {
        $team = $this->getCurrentTeam($current_team);
        abort_unless($acf->team_id === $team->id, 403);
        $acf->load(['cptDefinitions.subCpts']);

        return Inertia::render('admin/acf/edit', [
            'group' => [
                'id' => $acf->id,
                'title' => $acf->title,
                'slug' => $acf->slug,
                'description' => $acf->description,
                'content_type' => $acf->content_type,
                'is_active' => $acf->is_active,
                'is_standalone' => $acf->is_standalone,
                'standalone_label' => $acf->standalone_label,
                'standalone_icon' => $acf->standalone_icon,
                'order' => $acf->order,
                'fields' => $acf->cptDefinitions->map(fn (CptDefinition $f) => [
                    'id' => $f->id,
                    'label' => $f->label,
                    'name' => $f->name,
                    'type' => $f->type,
                    'required' => $f->required,
                    'order' => $f->order,
                    'options' => $f->options,
                    'settings' => $f->settings,
                    'instructions' => $f->instructions,
                    'default_value' => $f->default_value,
                    'translatable' => $f->translatable,
                    'sub_fields' => $f->subCpts->map(fn (CptDefinition $sf) => [
                        'id' => $sf->id,
                        'label' => $sf->label,
                        'name' => $sf->name,
                        'type' => $sf->type,
                        'required' => $sf->required,
                        'order' => $sf->order,
                        'options' => $sf->options,
                        'settings' => $sf->settings,
                        'translatable' => $sf->translatable,
                    ])->values(),
                ])->values(),
            ],
            'fieldTypes' => CptDefinition::TYPES,
            'contentTypes' => Cpt::CONTENT_TYPES,
        ]);
    }

    public function update(Request $request, string $current_team, Cpt $acf): RedirectResponse
    {
        $team = $this->getCurrentTeam($current_team);

        abort_unless($acf->team_id === $team->id, 403);

        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'content_type' => ['required', Rule::in(array_keys(Cpt::CONTENT_TYPES))],
            'is_standalone' => 'boolean',
            'standalone_label' => 'nullable|string|max:100',
            'standalone_icon' => 'nullable|string|max:50',
            'is_active' => 'boolean',
            'order' => 'integer',
            'fields' => 'array',
            'fields.*.id' => 'nullable|integer',
            'fields.*.label' => 'required|string',
            'fields.*.name' => 'required|string|alpha_dash',
            'fields.*.type' => ['required', Rule::in(CptDefinition::TYPES)],
            'fields.*.required' => 'boolean',
            'fields.*.order' => 'integer',
            'fields.*.options' => 'nullable|array',
            'fields.*.settings' => 'nullable|array',
            'fields.*.instructions' => 'nullable|string',
            'fields.*.translatable' => 'boolean',
            'fields.*.sub_fields.*.translatable' => 'boolean',
            'fields.*.sub_fields' => 'nullable|array',
            'fields.*.sub_fields.*.id' => 'nullable|integer',
            'fields.*.sub_fields.*.label' => 'required_with:fields.*.sub_fields|string',
            'fields.*.sub_fields.*.name' => 'required_with:fields.*.sub_fields|string|alpha_dash',
            'fields.*.sub_fields.*.type' => ['required_with:fields.*.sub_fields', Rule::in(CptDefinition::TYPES)],
        ]);

        $acf->update([
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'content_type' => $data['content_type'],
            'is_standalone' => $data['is_standalone'] ?? false,
            'standalone_label' => $data['standalone_label'] ?? null,
            'standalone_icon' => $data['standalone_icon'] ?? null,
            'is_active' => $data['is_active'] ?? true,
            'order' => $data['order'] ?? 0,
        ]);

        $incomingIds = collect($data['fields'] ?? [])
            ->pluck('id')->filter()->values()->toArray();

        $acf->allCptDefinitions()
            ->whereNotIn('id', $incomingIds)
            ->delete();

        $this->saveCptDefinitions($acf, $data['fields'] ?? []);

        return redirect()->route('admin.acf.index')
            ->with('success', 'Field group updated.');
    }

    public function destroy(string $current_team, Cpt $acf): RedirectResponse
    {
        $team = $this->getCurrentTeam($current_team);

        abort_unless($acf->team_id === $team->id, 403);

        $acf->delete();

        return redirect()->route('admin.acf.index')
            ->with('success', 'Field group deleted.');
    }

    private function saveCptDefinitions(Cpt $group, array $fields): void
    {
        foreach ($fields as $order => $fieldData) {
            $field = CptDefinition::updateOrCreate(
                ['id' => $fieldData['id'] ?? null],
                [
                    'cpt_id' => $group->id,
                    'label' => $fieldData['label'],
                    'name' => $fieldData['name'],
                    'type' => $fieldData['type'],
                    'required' => $fieldData['required'] ?? false,
                    'order' => $fieldData['order'] ?? $order,
                    'options' => $fieldData['options'] ?? null,
                    'settings' => $fieldData['settings'] ?? null,
                    'instructions' => $fieldData['instructions'] ?? null,
                    'default_value' => $fieldData['default_value'] ?? null,
                    'translatable' => $fieldData['translatable'] ?? CptDefinition::canTranslate($fieldData['type']),
                    'parent_id' => null,
                ]
            );

            if ($fieldData['type'] === 'repeater' && ! empty($fieldData['sub_fields'])) {
                $incomingSubIds = collect($fieldData['sub_fields'])->pluck('id')->filter()->values()->toArray();
                $field->subCpts()->whereNotIn('id', $incomingSubIds)->delete();

                foreach ($fieldData['sub_fields'] as $subOrder => $subData) {
                    CptDefinition::updateOrCreate(
                        ['id' => $subData['id'] ?? null],
                        [
                            'cpt_id' => $group->id,
                            'parent_id' => $field->id,
                            'label' => $subData['label'],
                            'name' => $subData['name'],
                            'type' => $subData['type'],
                            'required' => $subData['required'] ?? false,
                            'order' => $subData['order'] ?? $subOrder,
                            'options' => $subData['options'] ?? null,
                            'settings' => $subData['settings'] ?? null,
                            'translatable' => $subData['translatable'] ?? CptDefinition::canTranslate($subData['type']),
                        ]
                    );
                }
            }
        }
    }
}
