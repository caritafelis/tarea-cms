<?php

namespace App\JsonApi\V1\MediaLibraries;

use App\Models\MediaLibrary;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use LaravelJsonApi\Eloquent\Contracts\Paginator;
use LaravelJsonApi\Eloquent\Fields\ArrayList;
use LaravelJsonApi\Eloquent\Fields\DateTime;
use LaravelJsonApi\Eloquent\Fields\ID;
use LaravelJsonApi\Eloquent\Filters\WhereIdIn;
use LaravelJsonApi\Eloquent\Pagination\PagePagination;
use LaravelJsonApi\Eloquent\Schema;

class MediaLibrarySchema extends Schema
{
    public static string $model = MediaLibrary::class;

    protected int $maxDepth = 3;

    public function fields(): array
    {
        return [
            ID::make(),
            ArrayList::make('files')->readOnly()->extractUsing(
                fn ($model) => $model->media->map(fn ($m) => [
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
                ])->values()->all()
            ),
            DateTime::make('createdAt')->sortable()->readOnly(),
            DateTime::make('updatedAt')->sortable()->readOnly(),
        ];
    }

    public function filters(): array
    {
        return [WhereIdIn::make($this)];
    }

    public function indexQuery(?Request $request, Builder $query): Builder
    {
        return $query->with('media');
    }

    public function readQuery(?Request $request, Builder $query): Builder
    {
        return $query->with('media');
    }

    public function pagination(): ?Paginator
    {
        return PagePagination::make()->withDefaultPerPage(25);
    }
}