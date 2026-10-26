<?php

namespace App\JsonApi\V1\Inventories;

use App\Models\Inventory;
use LaravelJsonApi\Eloquent\Contracts\Paginator;
use LaravelJsonApi\Eloquent\Fields\Boolean;
use LaravelJsonApi\Eloquent\Fields\DateTime;
use LaravelJsonApi\Eloquent\Fields\ID;
use LaravelJsonApi\Eloquent\Fields\Number;
use LaravelJsonApi\Eloquent\Fields\Relations\BelongsTo;
use LaravelJsonApi\Eloquent\Fields\Str;
use LaravelJsonApi\Eloquent\Filters\WhereIdIn;
use LaravelJsonApi\Eloquent\Pagination\PagePagination;
use LaravelJsonApi\Eloquent\Schema;

class InventorySchema extends Schema
{
    public static string $model = Inventory::class;

    protected int $maxDepth = 3;

    public function fields(): array
    {
        return [
            ID::make(),
            Str::make('name'),
            Str::make('code'),
            Str::make('description'),
            Str::make('email'),
            Str::make('streetAddress', 'street_address'),
            Str::make('postalCode', 'postal_code'),
            Str::make('city'),
            Str::make('state'),
            Str::make('phoneNumber', 'phone_number'),
            Number::make('priority'),
            Number::make('latitude'),
            Number::make('longitude'),
            Boolean::make('isDefault', 'is_default'),
            BelongsTo::make('country')->type('countries'),
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
