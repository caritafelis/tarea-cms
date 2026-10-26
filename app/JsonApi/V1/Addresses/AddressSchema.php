<?php

namespace App\JsonApi\V1\Addresses;

use App\Models\Address;
use LaravelJsonApi\Eloquent\Contracts\Paginator;
use LaravelJsonApi\Eloquent\Fields\Boolean;
use LaravelJsonApi\Eloquent\Fields\DateTime;
use LaravelJsonApi\Eloquent\Fields\ID;
use LaravelJsonApi\Eloquent\Fields\Relations\BelongsTo;
use LaravelJsonApi\Eloquent\Fields\Str;
use LaravelJsonApi\Eloquent\Filters\WhereIdIn;
use LaravelJsonApi\Eloquent\Pagination\PagePagination;
use App\JsonApi\Concerns\ScopesToOwner;
use Illuminate\Database\Eloquent\Builder;
use LaravelJsonApi\Eloquent\Schema;

class AddressSchema extends Schema
{
    use ScopesToOwner;

    public static string $model = Address::class;

    protected int $maxDepth = 3;

    public function fields(): array
    {
        return [
            ID::make(),
            Str::make('firstName', 'first_name'),
            Str::make('lastName', 'last_name'),
            Str::make('companyName', 'company_name'),
            Str::make('streetAddress', 'street_address'),
            Str::make('streetAddressPlus', 'street_address_plus'),
            Str::make('postalCode', 'postal_code'),
            Str::make('city'),
            Str::make('state'),
            Str::make('phoneNumber', 'phone_number'),
            Boolean::make('shippingDefault', 'shipping_default'),
            Boolean::make('billingDefault', 'billing_default'),
            Str::make('type'),
            BelongsTo::make('country')->type('countries'),
            BelongsTo::make('user')->type('users')->readOnly(),
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
        return 'view_any_user';
    }
    protected function ownedBy(Builder $q, int|string $id): Builder {
        return $q->where('user_id', $id);
    }
}
