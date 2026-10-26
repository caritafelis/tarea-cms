<?php

namespace App\JsonApi\V1\OrderShippingEvents;

use App\Models\OrderShippingEvent;
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
 * Nested under Order only (reachable via /orders/{id}/shipping-events and
 * ?include=shippingEvents) - deliberately not given its own top-level
 * Api\V1 controller/route, since browsing ordershippingevents in isolation
 * across every order is not a real use case.
 */
class OrderShippingEventSchema extends Schema
{
    public static string $model = OrderShippingEvent::class;

    protected int $maxDepth = 2;

    public function fields(): array
    {
        return [
            ID::make(),
            Str::make('status'),
            Str::make('description'),
            Str::make('location'),
            Number::make('latitude'),
            Number::make('longitude'),
            DateTime::make('occurredAt', 'occurred_at'),
            BelongsTo::make('shipment')->type('order-shippings'),
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
