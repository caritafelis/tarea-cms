<?php

namespace Database\Seeders;

use App\Models\Cpt;
use App\Models\CptDefinition;
use App\Models\CptEntry;
use App\Models\Page;
use App\Models\Team;
use App\Models\User;
use App\Services\DynamicFieldsService;
use RuntimeException;

trait SeedsDynamicContent
{
    /** @var array<string, int> */
    private array $cptIds = [];

    /** Orden = índice usado por bi() */
    protected array $seedLocales = ['en', 'es'];

    protected function team(): Team
    {
        return Team::query()->where('is_personal', false)->orderBy('id')->firstOrFail();
    }

    protected function author(): User
    {
        return User::query()->where('is_super_admin', true)->orderBy('id')->firstOrFail();
    }

    /** Campo NO traducible (valor compartido entre idiomas). */
    protected function f(string $type, string $name, string $label, array $extra = []): array
    {
        return ['type' => $type, 'name' => $name, 'label' => $label] + $extra;
    }

    /** Campo traducible (un valor por idioma). */
    protected function t(string $type, string $name, string $label, array $extra = []): array
    {
        return $this->f($type, $name, $label, ['translatable' => true] + $extra);
    }

    /** Valor bilingüe [en, es]. */
    protected function bi(string $en, string $es): array
    {
        return ['__bi' => [$en, $es]];
    }

    /** @return array<string, array<string, mixed>> locale => data */
    protected function expandLocales(array $data): array
    {
        $out = [];

        foreach ($this->seedLocales as $i => $locale) {
            $out[$locale] = $this->pick($data, $i);
        }

        return $out;
    }

    private function pick(array $data, int $i): array
    {
        $r = [];

        foreach ($data as $key => $value) {
            $r[$key] = is_array($value)
                ? (isset($value['__bi']) ? $value['__bi'][$i] : $this->pick($value, $i))
                : $value;
        }

        return $r;
    }

    protected function options(array $map): array
    {
        $options = [];

        foreach ($map as $value => $label) {
            $options[] = ['label' => $label, 'value' => (string) $value];
        }

        return $options;
    }

    protected function upsertCpt(array $attributes, array $fields): Cpt
    {
        $cpt = Cpt::withTrashed()->firstOrNew(['slug' => $attributes['slug']]);
        $cpt->fill($attributes + ['team_id' => $this->team()->id])->save();

        if ($cpt->trashed()) {
            $cpt->restore();
        }

        $keep = [];

        foreach (array_values($fields) as $order => $spec) {
            $parent = $this->upsertDefinition($cpt, $spec, $order, null);
            $keep[] = $parent->id;

            foreach (array_values($spec['sub'] ?? []) as $subOrder => $subSpec) {
                $keep[] = $this->upsertDefinition($cpt, $subSpec, $subOrder, $parent->id)->id;
            }
        }

        CptDefinition::query()->where('cpt_id', $cpt->id)->whereNotIn('id', $keep)->delete();

        $this->cptIds[$cpt->slug] = $cpt->id;

        return $cpt;
    }

    private function upsertDefinition(Cpt $cpt, array $spec, int $order, ?int $parentId): CptDefinition
    {
        return CptDefinition::query()->updateOrCreate(
            ['cpt_id' => $cpt->id, 'name' => $spec['name'], 'parent_id' => $parentId],
            [
                'label' => $spec['label'],
                'type' => $spec['type'],
                'translatable' => $spec['translatable'] ?? false,
                'options' => $spec['options'] ?? null,
                'settings' => $spec['settings'] ?? null,
                'instructions' => $spec['instructions'] ?? null,
                'required' => $spec['required'] ?? false,
                'default_value' => $spec['default'] ?? null,
                'order' => $order,
            ],
        );
    }

    protected function upsertEntry(Cpt $cpt, string $slug, string $title, array $data, string $status = 'published'): CptEntry
    {
        $entry = CptEntry::withTrashed()->firstOrNew(['cpt_id' => $cpt->id, 'slug' => $slug]);
        $entry->fill(['title' => $title, 'status' => $status])->save();

        if ($entry->trashed()) {
            $entry->restore();
        }

        app(DynamicFieldsService::class)->saveSections($entry, [
            ['cpt_id' => $cpt->id, 'order' => 0, 'locales' => $this->expandLocales($data)],
        ]);

        return $entry;
    }

    /**
     * @param  array<string, string>  $title  locale => title
     * @param  array<int, array{0: string, 1: array, 2?: array}>  $blocks  [cpt slug, data, ?locales]
     */
    protected function upsertPage(string $slug, array $title, array $blocks): Page
    {
        $page = Page::query()->firstOrNew(['slug' => $slug]);
        $page->title = $title;
        $page->content = array_fill_keys(array_keys($title), '');
        $page->status = 'published';
        $page->user_id = $page->user_id ?: $this->author()->id;
        $page->save();

        $sections = [];

        foreach (array_values($blocks) as $order => $block) {
            $sections[] = [
                'cpt_id' => $this->cptId($block[0]),
                'order' => $order,
                'locales' => $block[2] ?? $this->expandLocales($block[1]),
            ];
        }

        app(DynamicFieldsService::class)->saveSections($page, $sections);

        return $page;
    }

    /** Sección que referencia un entry standalone (snapshot de sus valores por idioma). */
    protected function entryBlock(string $cptSlug, string $entrySlug): array
    {
        $cpt = Cpt::query()->where('slug', $cptSlug)->firstOrFail();
        $entry = CptEntry::query()->where('cpt_id', $cpt->id)->where('slug', $entrySlug)->firstOrFail();
        $section = $entry->contentSections()->firstOrFail();

        $locales = [];

        foreach ($this->seedLocales as $locale) {
            $locales[$locale] = array_merge($section->toStructuredData($locale), ['cpt_entry_id' => $entry->id]);
        }

        return [$cptSlug, [], $locales];
    }

    private function cptId(string $slug): int
    {
        $id = $this->cptIds[$slug] ?? Cpt::query()->where('slug', $slug)->value('id');

        if (! $id) {
            throw new RuntimeException("Field group [{$slug}] not found. Run SiteFieldGroupsSeeder first.");
        }

        return (int) $id;
    }
}