<?php

namespace App\JsonApi\V1\CptDefinitions;

use App\Models\CptDefinition;
use LaravelJsonApi\Eloquent\Contracts\Paginator;
use LaravelJsonApi\Eloquent\Fields\ArrayHash;
use LaravelJsonApi\Eloquent\Fields\Boolean;
use LaravelJsonApi\Eloquent\Fields\DateTime;
use LaravelJsonApi\Eloquent\Fields\ID;
use LaravelJsonApi\Eloquent\Fields\Number;
use LaravelJsonApi\Eloquent\Fields\Relations\BelongsTo;
use LaravelJsonApi\Eloquent\Fields\Relations\HasMany;
use LaravelJsonApi\Eloquent\Fields\Str;
use LaravelJsonApi\Eloquent\Filters\WhereIdIn;
use LaravelJsonApi\Eloquent\Pagination\PagePagination;
use LaravelJsonApi\Eloquent\Schema;

class CptDefinitionSchema extends Schema
{
    public static string $model = CptDefinition::class;

    protected int $maxDepth = 3;

    public function fields(): array
    {
        return [
            ID::make(),
            Str::make('label'),
            Str::make('name'),
            Str::make('type'),
            Boolean::make('required'),
            ArrayHash::make('options'),
            Str::make('instructions'),
            Str::make('defaultValue', 'default_value'),
            Number::make('order')->sortable(),
            BelongsTo::make('cpts')->type('cpts'),
            BelongsTo::make('parent')->type('cpt-definitions'),
            HasMany::make('subCpts')->type('cpt-definitions'),
            Boolean::make('translatable'),
            DateTime::make('createdAt')->sortable()->readOnly(),
            DateTime::make('updatedAt')->sortable()->readOnly(),
        ];
    }

    public function filters(): array
    {
        return [WhereIdIn::make($this)];
    }

    public function pagination(): ?Paginator
    {
        return PagePagination::make()->withDefaultPerPage(100);
    }
}
