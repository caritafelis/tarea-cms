<?php

namespace App\JsonApi\V1\Brands;

use App\JsonApi\Concerns\ScopesToVisible;
use App\Models\Brand;
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

class BrandSchema extends Schema
{
    use ScopesToVisible;

    public static string $model = Brand::class;

    protected int $maxDepth = 3;

    public function fields(): array
    {
        return [
            ID::make(),
            Str::make('name'),
            Str::make('slug'),
            Str::make('website'),
            Str::make('description'),
            Number::make('position')->sortable(),
            Boolean::make('isEnabled', 'is_enabled'),
            HasMany::make('products')->type('products'),
            DateTime::make('createdAt')->sortable()->readOnly(),
            DateTime::make('updatedAt')->sortable()->readOnly(),
        ];
    }

    public function filters(): array
    {
        return [WhereIdIn::make($this), Where::make('slug')];
    }

    protected function bypassPermission(): string
    {
        return 'view_any_brand';
    }

    protected function visible(Builder $query): Builder
    {
        return $query->where('is_enabled', true);
    }

    public function pagination(): ?Paginator
    {
        return PagePagination::make()->withDefaultPerPage(50);
    }
}
