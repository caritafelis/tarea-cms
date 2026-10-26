<?php

namespace App\Concerns;

use App\Models\ContentSection;
use App\Models\Cpt;
use App\Models\Page;
use App\Models\Post;
use App\Models\Product;
use Illuminate\Database\Eloquent\Relations\MorphMany;

trait HasDynamicFields
{
    public function contentSections(): MorphMany
    {
        return $this->morphMany(ContentSection::class, 'sectionable')->orderBy('order');
    }

    public function getDynamicFieldsAttribute(): array
    {
        return $this->dynamicFieldsFor(app()->getLocale());
    }

    /**
     * @param  array<int, string>|null  $locales  si se pasa, cada sección incluye `locales` (editor admin)
     */
    public function dynamicFieldsFor(?string $locale = null, ?array $locales = null): array
    {
        return $this->contentSections()
            ->with(['cpt.allCptDefinitions', 'values'])
            ->get()
            ->map(function (ContentSection $section) use ($locale, $locales) {
                $row = [
                    'section_id' => $section->id,
                    'cpt_id' => $section->cpt_id,
                    'group_slug' => $section->cpt->slug,
                    'group_title' => $section->cpt->title,
                    'order' => $section->order,
                    'data' => $section->toStructuredData($locale),
                ];

                if ($locales) {
                    $row['locales'] = $section->toLocalizedData($locales);
                }

                return $row;
            })
            ->toArray();
    }

    public function availableCpts()
    {
        $type = match (static::class) {
            Post::class => 'post',
            Page::class => 'page',
            Product::class => 'product',
            default => 'any',
        };

        return Cpt::active()->forContentType($type)->with('cptDefinitions')->get();
    }

    protected ?array $pendingSections = null;

    public function setDynamicFieldsAttribute(array $sections): void
    {
        $this->pendingSections = $sections;
    }

    protected static function bootHasDynamicFields(): void
    {
        static::saved(function ($model) {
            if ($model->pendingSections !== null) {
                app(\App\Services\DynamicFieldsService::class)
                    ->saveSections($model, $model->pendingSections, request()->query('locale'));
                $model->pendingSections = null;
            }
        });
    }
}