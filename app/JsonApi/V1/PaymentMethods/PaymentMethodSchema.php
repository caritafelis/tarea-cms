<?php

namespace App\JsonApi\V1\PaymentMethods;

use App\Models\PaymentMethod;
use LaravelJsonApi\Eloquent\Contracts\Paginator;
use LaravelJsonApi\Eloquent\Fields\Boolean;
use LaravelJsonApi\Eloquent\Fields\DateTime;
use LaravelJsonApi\Eloquent\Fields\ID;
use LaravelJsonApi\Eloquent\Fields\Str;
use LaravelJsonApi\Eloquent\Filters\WhereIdIn;
use LaravelJsonApi\Eloquent\Pagination\PagePagination;
use App\JsonApi\Concerns\ScopesToVisible;
use Illuminate\Database\Eloquent\Builder;
use LaravelJsonApi\Eloquent\Schema;

class PaymentMethodSchema extends Schema
{
    
    use ScopesToVisible;

    /**
     * The model the schema corresponds to.
     */
    public static string $model = PaymentMethod::class;

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
            Str::make('title'),
            Str::make('slug'),
            Str::make('logo'),
            Str::make('linkUrl', 'link_url'),
            Str::make('description'),
            Str::make('instructions'),
            Str::make('driver'),
            Boolean::make('isEnabled', 'is_enabled'),
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

    protected function bypassPermission(): string 
    { 
        return 'view_any_payment_method'; 
    }
    protected function visible(Builder $q): Builder 
    { 
        return $q->where('is_enabled', true); 
    }
}
