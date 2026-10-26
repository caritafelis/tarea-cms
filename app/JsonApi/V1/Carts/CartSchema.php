<?php

namespace App\JsonApi\V1\Carts;

use App\Models\Cart\Cart;
use LaravelJsonApi\Eloquent\Contracts\Paginator;
use LaravelJsonApi\Eloquent\Fields\DateTime;
use LaravelJsonApi\Eloquent\Fields\ID;
use LaravelJsonApi\Eloquent\Fields\Relations\BelongsTo;
use LaravelJsonApi\Eloquent\Fields\Relations\HasMany;
use LaravelJsonApi\Eloquent\Fields\Str;
use LaravelJsonApi\Eloquent\Filters\WhereIdIn;
use LaravelJsonApi\Eloquent\Pagination\PagePagination;
use App\JsonApi\Concerns\ScopesToOwner;
use Illuminate\Database\Eloquent\Builder;
use LaravelJsonApi\Eloquent\Schema;

class CartSchema extends Schema
{
    use ScopesToOwner;

    public static string $model = Cart::class;

    protected int $maxDepth = 3;

    public function fields(): array
    {
        return [
            ID::make(),
            Str::make('currencyCode', 'currency_code'),
            Str::make('couponCode', 'coupon_code'),
            DateTime::make('completedAt', 'completed_at'),
            HasMany::make('lines')->type('cart-lines'),
            HasMany::make('addresses')->type('cart-addresses'),
            BelongsTo::make('customer')->type('users')->readOnly(),
            BelongsTo::make('channel')->type('channels'),
            BelongsTo::make('zone')->type('zones'),
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
        return $q->where('customer_id', $id);
    }
}
