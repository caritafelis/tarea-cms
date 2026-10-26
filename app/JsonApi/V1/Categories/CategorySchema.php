<?php

namespace App\JsonApi\V1\Categories;

use App\JsonApi\Concerns\ScopesToVisible;
use App\Models\Category;
use Illuminate\Database\Eloquent\Builder;
use LaravelJsonApi\Eloquent\Contracts\Paginator;
use LaravelJsonApi\Eloquent\Fields\Boolean;
use LaravelJsonApi\Eloquent\Fields\DateTime;
use LaravelJsonApi\Eloquent\Fields\ID;
use LaravelJsonApi\Eloquent\Fields\Number;
use LaravelJsonApi\Eloquent\Fields\Relations\BelongsTo;
use LaravelJsonApi\Eloquent\Fields\Relations\HasMany;
use LaravelJsonApi\Eloquent\Fields\Str;
use LaravelJsonApi\Eloquent\Filters\Where;
use LaravelJsonApi\Eloquent\Filters\WhereIdIn;
use LaravelJsonApi\Eloquent\Pagination\PagePagination;
use LaravelJsonApi\Eloquent\Schema;

class CategorySchema extends Schema
{
    use ScopesToVisible;

    public static string $model = Category::class;

    protected int $maxDepth = 3;

    public function fields(): array
    {
        return [
            ID::make(),
            Str::make('name'),
            Str::make('slug'),
            Str::make('description'),
            Number::make('position')->sortable(),
            Boolean::make('isEnabled', 'is_enabled'),
            BelongsTo::make('parent')->type('categories'),
            HasMany::make('children')->type('categories'),
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
        return 'view_any_category';
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
