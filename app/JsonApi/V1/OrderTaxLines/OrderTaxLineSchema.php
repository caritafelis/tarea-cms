<?php

namespace App\JsonApi\V1\OrderTaxLines;

use App\Models\OrderTaxLine;
use LaravelJsonApi\Eloquent\Contracts\Paginator;
use LaravelJsonApi\Eloquent\Fields\DateTime;
use LaravelJsonApi\Eloquent\Fields\ID;
use LaravelJsonApi\Eloquent\Fields\Number;
use LaravelJsonApi\Eloquent\Fields\Relations\BelongsTo;
use LaravelJsonApi\Eloquent\Fields\Str;
use LaravelJsonApi\Eloquent\Filters\WhereIdIn;
use LaravelJsonApi\Eloquent\Pagination\PagePagination;
use LaravelJsonApi\Eloquent\Schema;

/**
 * Nested under Order only (reachable via /orders/{id}/tax-lines and
 * ?include=taxLines) - deliberately not given its own top-level
 * Api\V1 controller/route, since browsing ordertaxlines in isolation
 * across every order is not a real use case.
 */
class OrderTaxLineSchema extends Schema
{
    public static string $model = OrderTaxLine::class;

    protected int $maxDepth = 2;

    public function fields(): array
    {
        return [
            ID::make(),
            Str::make('code'),
            Str::make('name'),
            Number::make('rate'),
            Number::make('amount'),
            BelongsTo::make('taxRate')->type('tax-rates'),
            DateTime::make('createdAt')->sortable()->readOnly(),
            DateTime::make('updatedAt')->sortable()->readOnly(),
        ];
    }

    public function filters(): array
    {
        return [
            WhereIdIn::make($this),
        ];
    }

    public function pagination(): ?Paginator
    {
        return PagePagination::make()->withDefaultPerPage(25);
    }
}
