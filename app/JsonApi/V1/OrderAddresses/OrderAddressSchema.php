<?php

namespace App\JsonApi\V1\OrderAddresses;

use App\Models\OrderAddress;
use LaravelJsonApi\Eloquent\Contracts\Paginator;
use LaravelJsonApi\Eloquent\Fields\DateTime;
use LaravelJsonApi\Eloquent\Fields\ID;
use LaravelJsonApi\Eloquent\Fields\Relations\BelongsTo;
use LaravelJsonApi\Eloquent\Fields\Str;
use LaravelJsonApi\Eloquent\Filters\WhereIdIn;
use LaravelJsonApi\Eloquent\Pagination\PagePagination;
use LaravelJsonApi\Eloquent\Schema;

/**
 * Nested under Order only (reachable via /orders/{id}/addresses and
 * ?include=addresses) - deliberately not given its own top-level
 * Api\V1 controller/route, since browsing orderaddresses in isolation
 * across every order is not a real use case.
 */
class OrderAddressSchema extends Schema
{
    public static string $model = OrderAddress::class;

    protected int $maxDepth = 2;

    public function fields(): array
    {
        return [
            ID::make(),
            Str::make('firstName', 'first_name'),
            Str::make('lastName', 'last_name'),
            Str::make('company'),
            Str::make('streetAddress', 'street_address'),
            Str::make('streetAddressPlus', 'street_address_plus'),
            Str::make('postalCode', 'postal_code'),
            Str::make('city'),
            Str::make('state'),
            Str::make('phone'),
            Str::make('countryName', 'country_name'),
            BelongsTo::make('customer')->type('users'),
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
