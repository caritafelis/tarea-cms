<?php

namespace App\Services;

use App\Models\ContentSection;
use App\Models\ContentSectionValue;
use App\Models\Cpt;
use App\Models\CptDefinition;
use App\Support\ContentLocales;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class DynamicFieldsService
{
    /**
     * Cada sección acepta:
     *  - `locales`: ['en' => [...], 'es' => [...]]  (editor / seeders)
     *  - `data`: [...] para un solo idioma ($locale o el default)  (clientes API)
     */
    public function saveSections(Model $model, array $sections, ?string $locale = null): void
    {
        DB::transaction(function () use ($model, $sections, $locale) {
            $incomingIds = collect($sections)->pluck('section_id')->filter()->values();

            $model->contentSections()
                ->whereNotIn('id', $incomingIds)
                ->get()
                ->each(function (ContentSection $section) {
                    $section->values()->delete();
                    $section->delete();
                });

            foreach ($sections as $index => $sectionInput) {
                $perLocale = $this->perLocale($sectionInput, $locale);

                $cptEntryId = $sectionInput['data']['cpt_entry_id']
                    ?? collect($perLocale)->pluck('cpt_entry_id')->filter()->first();

                $group = Cpt::findOrFail($sectionInput['cpt_id']);

                $values = [
                    'cpt_id' => $group->id,
                    'cpt_entry_id' => $cptEntryId,
                    'order' => $sectionInput['order'] ?? $index,
                ];

                $sectionId = $sectionInput['section_id'] ?? null;
                $section = $sectionId
                    ? $model->contentSections()->whereKey($sectionId)->first()
                    : null;

                if ($section) {
                    $section->update($values);
                } else {
                    $section = $model->contentSections()->create($values);
                }

                $this->saveValues($section, $group, $perLocale);
            }
        });
    }

    /** @return array<string, array<string, mixed>> */
    private function perLocale(array $input, ?string $locale): array
    {
        if (! empty($input['locales']) && is_array($input['locales'])) {
            return $input['locales'];
        }

        return [($locale ?? ContentLocales::default()) => $input['data'] ?? []];
    }

    /**
     * Traducibles: se reescriben por (campo, idioma).
     * No traducibles: se escriben una sola vez con locale NULL (compartidos).
     * Solo se tocan los campos presentes en el payload.
     *
     * @param  array<string, array<string, mixed>>  $perLocale
     */
    private function saveValues(ContentSection $section, Cpt $group, array $perLocale): void
    {
        $fields = $group->cptDefinitions()->with('subCpts')->get();
        $sharedDone = [];

        foreach ($perLocale as $locale => $data) {
            foreach ($fields as $field) {
                if (! array_key_exists($field->name, $data)) {
                    continue;
                }

                if ($field->isRepeater()) {
                    $rows = is_array($data[$field->name]) ? array_values($data[$field->name]) : [];

                    foreach ($field->subCpts as $sub) {
                        if (! $this->shouldWrite($sub, $sharedDone)) {
                            continue;
                        }

                        $loc = $sub->translatable ? (string) $locale : null;
                        $this->clear($section, $sub, $loc);

                        foreach ($rows as $i => $row) {
                            $this->insertValue($section, $sub, $i, $loc, $row[$sub->name] ?? null);
                        }
                    }

                    continue;
                }

                if (! $this->shouldWrite($field, $sharedDone)) {
                    continue;
                }

                $loc = $field->translatable ? (string) $locale : null;
                $this->clear($section, $field, $loc);
                $this->insertValue($section, $field, 0, $loc, $data[$field->name]);
            }
        }
    }

    /** @param  array<int, bool>  $sharedDone */
    private function shouldWrite(CptDefinition $field, array &$sharedDone): bool
    {
        if ($field->translatable) {
            return true;
        }

        if (isset($sharedDone[$field->id])) {
            return false;
        }

        return $sharedDone[$field->id] = true;
    }

    private function clear(ContentSection $section, CptDefinition $field, ?string $locale): void
    {
        $section->values()
            ->where('cpt_definition_id', $field->id)
            ->where('locale', $locale)
            ->delete();
    }

    private function insertValue(
        ContentSection $section,
        CptDefinition $field,
        int $rowIndex,
        ?string $locale,
        mixed $value
    ): void {
        ContentSectionValue::create([
            'content_section_id' => $section->id,
            'cpt_definition_id' => $field->id,
            'row_index' => $rowIndex,
            'locale' => $locale,
            'value' => is_array($value) ? json_encode($value) : $value,
        ]);
    }
}