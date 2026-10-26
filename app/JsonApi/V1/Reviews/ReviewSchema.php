<?php

namespace App\JsonApi\V1\Reviews;

use App\Models\Review;
use LaravelJsonApi\Eloquent\Contracts\Paginator;
use LaravelJsonApi\Eloquent\Fields\Boolean;
use LaravelJsonApi\Eloquent\Fields\DateTime;
use LaravelJsonApi\Eloquent\Fields\ID;
use LaravelJsonApi\Eloquent\Fields\Number;
use LaravelJsonApi\Eloquent\Fields\Str;
use LaravelJsonApi\Eloquent\Filters\WhereIdIn;
use LaravelJsonApi\Eloquent\Pagination\PagePagination;
use App\JsonApi\Concerns\ScopesToVisible; 
use Illuminate\Database\Eloquent\Builder;
use LaravelJsonApi\Eloquent\Schema;

class ReviewSchema extends Schema
{

    use ScopesToVisible;

    /**
     * The model the schema corresponds to.
     */
    public static string $model = Review::class;

    /**
     * The maximum depth of include paths.
     */
    protected int $maxDepth = 3;

    /**
     * Get the resource fields.
     */
    public function fields(): array
    {
        return [
            ID::make(),
            Boolean::make('isRecommended', 'is_recommended'),
            Number::make('rating'),
            Str::make('title'),
            Str::make('content'),
            Boolean::make('approved'),
            DateTime::make('createdAt')->sortable()->readOnly(),
            DateTime::make('updatedAt')->sortable()->readOnly(),
        ];
    }

    /**
     * Get the resource filters.
     */
    public function filters(): array
    {
        return [
            WhereIdIn::make($this),
        ];
    }

    /**
     * Get the resource paginator.
     */
    public function pagination(): ?Paginator
    {
        return PagePagination::make()->withDefaultPerPage(25);
    }

    protected function bypassPermission(): string {
         return 'view_any_review'; 
    }
    
    protected function visible(Builder $q): Builder {
         return $q->where('approved', true); 
    }

}
