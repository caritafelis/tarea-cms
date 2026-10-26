<?php

namespace App\Models;

use App\Support\ContentLocales;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Collection;

class ContentSection extends Model
{
    use HasFactory;

    protected $fillable = [
        'cpt_id',
        'cpt_entry_id',
        'sectionable_id',
        'sectionable_type',
        'order',
    ];

    protected $casts = ['order' => 'integer'];

    public function cpt(): BelongsTo
    {
        return $this->belongsTo(Cpt::class);
    }

    public function sectionable(): MorphTo
    {
        return $this->morphTo();
    }

    public function values(): HasMany
    {
        return $this->hasMany(ContentSectionValue::class);
    }

    public function entry(): BelongsTo
    {
        return $this->belongsTo(CptEntry::class, 'cpt_entry_id');
    }

    /**
     * Datos del idioma pedido (por defecto el de la request).
     * `?fallback=1` completa los campos traducibles vacíos con el idioma por defecto.
     */
    public function toStructuredData(?string $locale = null, ?string $fallback = null): array
    {
        $locale ??= app()->getLocale();
        $fallback ??= request()->boolean('fallback') ? ContentLocales::default() : null;

        if ($fallback === $locale) {
            $fallback = null;
        }

        $this->loadMissing(['cpt.allCptDefinitions', 'values']);

        $fields = $this->cpt->allCptDefinitions;
        $values = $this->values->groupBy('cpt_definition_id');
        $result = ['cpt_entry_id' => $this->cpt_entry_id];

        foreach ($fields->whereNull('parent_id') as $field) {
            if ($field->isRepeater()) {
                $subs = $fields->where('parent_id', $field->id);

                // Filas = máximo entre todos los idiomas: los idiomas sin traducir muestran filas vacías.
                $count = (int) ($subs->map(
                    fn ($s) => ($values->get($s->id)?->max('row_index') ?? -1) + 1
                )->max() ?? 0);

                $rows = [];
                for ($i = 0; $i < $count; $i++) {
                    $row = [];
                    foreach ($subs as $sub) {
                        $row[$sub->name] = $this->valueFor($values->get($sub->id), $sub, $i, $locale, $fallback);
                    }
                    $rows[] = $row;
                }

                $result[$field->name] = $rows;
            } else {
                $result[$field->name] = $this->valueFor($values->get($field->id), $field, 0, $locale, $fallback);
            }
        }

        return $result;
    }

    /** @param  array<int, string>  $locales */
    public function toLocalizedData(array $locales): array
    {
        $out = [];

        foreach ($locales as $locale) {
            $out[$locale] = $this->toStructuredData($locale, null);
        }

        return $out;
    }

    private function valueFor(?Collection $rows, CptDefinition $field, int $row, string $locale, ?string $fallback): mixed
    {
        $raw = null;

        if ($rows) {
            $pick = fn (?string $loc) => $rows->first(
                fn ($v) => $v->row_index === $row && $v->locale === $loc
            );

            $raw = $pick($field->translatable ? $locale : null)?->value;

            if ($field->translatable && ($raw === null || $raw === '') && $fallback) {
                $raw = $pick($fallback)?->value;
            }
        }

        if ($raw === null) {
            return $field->type === 'checkbox' ? [] : null;
        }

        return $this->castValue($raw, $field);
    }

    private function castValue(mixed $raw, CptDefinition $field): mixed
    {
        return match ($field->type) {
            'number' => is_numeric($raw) ? (float) $raw : null,
            'checkbox' => json_decode($raw, true) ?? [],
            'image', 'file', 'select', 'relation' => json_decode($raw, true) ?? $raw,
            default => $raw,
        };
    }
}