<?php

namespace App\JsonApi\V1\OrderShippings;

use App\Models\OrderShipping;
use LaravelJsonApi\Eloquent\Contracts\Paginator;
use LaravelJsonApi\Eloquent\Fields\DateTime;
use LaravelJsonApi\Eloquent\Fields\ID;
use LaravelJsonApi\Eloquent\Fields\Relations\BelongsTo;
use LaravelJsonApi\Eloquent\Fields\Relations\HasMany;
use LaravelJsonApi\Eloquent\Fields\Str;
use LaravelJsonApi\Eloquent\Filters\WhereIdIn;
use LaravelJsonApi\Eloquent\Pagination\PagePagination;
use LaravelJsonApi\Eloquent\Schema;

/**
 * Nested under Order only (reachable via /orders/{id}/shipments and
 * ?include=shipments) - deliberately not given its own top-level
 * Api\V1 controller/route, since browsing ordershippings in isolation
 * across every order is not a real use case.
 */
class OrderShippingSchema extends Schema
{
    public static string $model = OrderShipping::class;

    protected int $maxDepth = 2;

    public function fields(): array
    {
        return [
            ID::make(),
            Str::make('status'),
            DateTime::make('shippedAt', 'shipped_at'),
            DateTime::make('receivedAt', 'received_at'),
            DateTime::make('returnedAt', 'returned_at'),
            Str::make('trackingNumber', 'tracking_number'),
            Str::make('trackingUrl', 'tracking_url'),
            BelongsTo::make('order')->type('orders'),
            BelongsTo::make('carrier')->type('carriers'),
            HasMany::make('items')->type('order-items'),
            HasMany::make('events')->type('order-shipping-events'),
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
