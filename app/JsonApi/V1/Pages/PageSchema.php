<?php

namespace App\JsonApi\V1\Pages;

use App\JsonApi\Concerns\ScopesToVisible;
use App\Models\Page;
use Illuminate\Database\Eloquent\Builder;
use LaravelJsonApi\Eloquent\Contracts\Paginator;
use LaravelJsonApi\Eloquent\Fields\ArrayHash;
use LaravelJsonApi\Eloquent\Fields\DateTime;
use LaravelJsonApi\Eloquent\Fields\ID;
use LaravelJsonApi\Eloquent\Fields\Str;
use LaravelJsonApi\Eloquent\Filters\Where;
use LaravelJsonApi\Eloquent\Filters\WhereIdIn;
use LaravelJsonApi\Eloquent\Pagination\PagePagination;
use LaravelJsonApi\Eloquent\Schema;

class PageSchema extends Schema
{
    use ScopesToVisible;

    public static string $model = Page::class;

    protected int $maxDepth = 3;

    public function fields(): array
    {
        return [
            ID::make(),
            Str::make('title'),
            Str::make('content'),
            Str::make('slug'),
            Str::make('status'),
            ArrayHash::make('sections', 'dynamic_fields'),
            DateTime::make('createdAt')->sortable()->readOnly(),
            DateTime::make('updatedAt')->sortable()->readOnly(),
        ];
    }

    public function filters(): array
    {
        return [WhereIdIn::make($this), Where::make('slug'), Where::make('status')];
    }

    protected function bypassPermission(): string
    {
        return 'view_any_page';
    }

    protected function visible(Builder $query): Builder
    {
        return $query->where('status', 'published');
    }

    public function pagination(): ?Paginator
    {
        return PagePagination::make()->withDefaultPerPage(25);
    }
}
