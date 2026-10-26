<?php

namespace App\Data;

/**
 * Simple value object describing a media collection configuration
 * (name, disk and accepted mime types) for models using Spatie's
 * media library.
 */
final class MediaCollectionConfig
{
    /**
     * @param  array<int, string>  $acceptsMimeTypes
     */
    public function __construct(
        public readonly string $name,
        public readonly string $disk = 'public',
        public readonly array $acceptsMimeTypes = [],
    ) {}
}
