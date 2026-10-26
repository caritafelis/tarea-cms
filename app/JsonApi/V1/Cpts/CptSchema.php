<?php

namespace App\JsonApi\V1\Cpts;

use App\JsonApi\Concerns\ScopesToVisible;
use App\Models\Cpt;
use Illuminate\Database\Eloquent\Builder;
use LaravelJsonApi\Eloquent\Contracts\Paginator;
use LaravelJsonApi\Eloquent\Fields\Boolean;
use LaravelJsonApi\Eloquent\Fields\DateTime;
use LaravelJsonApi\Eloquent\Fields\ID;
use LaravelJsonApi\Eloquent\Fields\Number;
use LaravelJsonApi\Eloquent\Fields\Relations\HasMany;
use LaravelJsonApi\Eloquent\Fields\Str;
use LaravelJsonApi\Eloquent\Filters\Where;
use LaravelJsonApi\Eloquent\Filters\WhereIdIn;
use LaravelJsonApi\Eloquent\Pagination\PagePagination;
use LaravelJsonApi\Eloquent\Schema;

class CptSchema extends Schema
{
    use ScopesToVisible;

    public static string $model = Cpt::class;

    protected int $maxDepth = 3;

    public function fields(): array
    {
        return [
            ID::make(),
            Str::make('title'),
            Str::make('slug'),
            Str::make('description'),
            Str::make('contentType', 'content_type'),
            Boolean::make('isActive', 'is_active'),
            Number::make('order')->sortable(),
            Boolean::make('isStandalone', 'is_standalone'),
            Str::make('standaloneLabel', 'standalone_label'),
            HasMany::make('cptDefinitions')->type('cpt-definitions'),
            HasMany::make('entries')->type('cpt-entries'),
            DateTime::make('createdAt')->sortable()->readOnly(),
            DateTime::make('updatedAt')->sortable()->readOnly(),
        ];
    }

    public function filters(): array
    {
        return [
            WhereIdIn::make($this),
            Where::make('slug'),
            Where::make('contentType', 'content_type'),
        ];
    }

    protected function bypassPermission(): string
    {
        return 'view_any_cpt';
    }

    protected function visible(Builder $query): Builder
    {
        return $query->active();
    }

    public function pagination(): ?Paginator
    {
        return PagePagination::make()->withDefaultPerPage(50);
    }
}
