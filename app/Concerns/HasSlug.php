<?php

namespace App\Concerns;

use Spatie\Sluggable\HasSlug as SpatieHasSlug;
use Spatie\Sluggable\SlugOptions;

trait HasSlug
{
    use SpatieHasSlug;

    /**
     * Find a model by its slug.
     */
    public static function findBySlug(string $slug): static
    {
        return static::query()
            ->where('slug', $slug)
            ->firstOrFail();
    }

    /**
     * Configure slug generation.
     *
     * Override slugSource() in your model if necessary.
     */
    public function getSlugOptions(): SlugOptions
    {
        return SlugOptions::create()
            ->generateSlugsFrom(fn () => $this->resolveSlugSource())
            ->saveSlugsTo($this->slugColumn())
            ->doNotGenerateSlugsOnUpdate();
    }

    /**
     * Resolve the value used to generate the slug.
     */
    protected function resolveSlugSource(): string
    {
        $source = $this->slugSource();

        if (is_callable($source)) {
            return (string) $source();
        }

        return (string) data_get($this, $source);
    }

    /**
     * Column used to store the slug.
     */
    protected function slugColumn(): string
    {
        return 'slug';
    }

    /**
     * Source used to generate the slug.
     *
     * Override this in your model.
     */
    protected function slugSource(): string|\Closure
    {
        if (property_exists($this, 'translatable')) {
            if (in_array('title', $this->translatable, true)) {
                return fn () => $this->slug ?: $this->getTranslation('title', app()->getLocale());
            }

            if (in_array('name', $this->translatable, true)) {
                return fn () => $this->slug ?: $this->getTranslation('name', app()->getLocale());
            }
        }

        if (isset($this->name)) {
            return 'name';
        }

        if (isset($this->title)) {
            return 'title';
        }

        throw new \LogicException(sprintf(
            'Unable to determine slug source for [%s]. Override slugSource() in the model.',
            static::class
        ));
    }
}
