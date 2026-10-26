<?php

namespace App\JsonApi\V1\CartAddresses;

use App\Models\Cart\CartAddress;
use LaravelJsonApi\Eloquent\Contracts\Paginator;
use LaravelJsonApi\Eloquent\Fields\DateTime;
use LaravelJsonApi\Eloquent\Fields\ID;
use LaravelJsonApi\Eloquent\Fields\Relations\BelongsTo;
use LaravelJsonApi\Eloquent\Fields\Str;
use LaravelJsonApi\Eloquent\Filters\WhereIdIn;
use LaravelJsonApi\Eloquent\Pagination\PagePagination;
use App\JsonApi\Concerns\ScopesToOwner;
use Illuminate\Database\Eloquent\Builder;
use LaravelJsonApi\Eloquent\Schema;

class CartAddressSchema extends Schema
{
    use ScopesToOwner;

    public static string $model = CartAddress::class;

    protected int $maxDepth = 3;

    public function fields(): array
    {
        return [
            ID::make(),
            Str::make('type'),
            Str::make('firstName', 'first_name'),
            Str::make('lastName', 'last_name'),
            Str::make('company'),
            Str::make('address1', 'address_1'),
            Str::make('address2', 'address_2'),
            Str::make('city'),
            Str::make('state'),
            Str::make('postalCode', 'postal_code'),
            Str::make('phone'),
            BelongsTo::make('cart')->type('carts'),
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

    protected function bypassPermission(): string
    {
        return 'view_any_order';
    }

    protected function ownedBy(Builder $q, int|string $id): Builder
    {
        return $q->whereHas('cart', fn($c) => $c->where('customer_id', $id));
    }
}
