<?php

namespace App\JsonApi\V1\Currencies;

use App\Models\Currency;
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

class CurrencySchema extends Schema
{
    use ScopesToVisible;

    /**
     * The model the schema corresponds to.
     */
    public static string $model = Currency::class;

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
            Str::make('name'),
            Str::make('code'),
            Str::make('symbol'),
            Str::make('format'),
            Number::make('exchangeRate', 'exchange_rate'),
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

    protected function bypassPermission(): string { 
        return 'view_any_currency'; 
    }

    protected function visible(Builder $q): Builder { 
        return $q->where('is_enabled', true); 
    }

}
