<?php

namespace App\GraphQL\Queries;

class MediaFiles
{
    public function __invoke($root): array
    {
        return $root->loadMissing('media')->media->map(fn ($m) => [
            'name' => $m->name,
            'filename' => $m->file_name,
            'mime' => $m->mime_type,
            'size' => $m->size,
            'collection' => $m->collection_name,
            'alt' => $m->getCustomProperty('alt'),
            'url' => $m->getUrl(),
            'thumb' => $m->hasGeneratedConversion('thumb') ? $m->getUrl('thumb') : null,
            'large' => $m->hasGeneratedConversion('large') ? $m->getUrl('large') : null,
            'webp' => $m->hasGeneratedConversion('webp') ? $m->getUrl('webp') : null,
        ])->values()->all();
    }
}