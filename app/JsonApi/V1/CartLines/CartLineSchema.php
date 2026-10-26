<?php

namespace App\JsonApi\V1\CartLines;

use App\Models\Cart\CartLine;
use LaravelJsonApi\Eloquent\Contracts\Paginator;
use LaravelJsonApi\Eloquent\Fields\DateTime;
use LaravelJsonApi\Eloquent\Fields\ID;
use LaravelJsonApi\Eloquent\Fields\Number;
use LaravelJsonApi\Eloquent\Fields\Relations\BelongsTo;
use LaravelJsonApi\Eloquent\Fields\Relations\HasMany;
use LaravelJsonApi\Eloquent\Filters\WhereIdIn;
use LaravelJsonApi\Eloquent\Pagination\PagePagination;
use App\JsonApi\Concerns\ScopesToOwner;
use Illuminate\Database\Eloquent\Builder;
use LaravelJsonApi\Eloquent\Fields\Str;
use LaravelJsonApi\Eloquent\Schema;

class CartLineSchema extends Schema
{
    use ScopesToOwner;
    
    public static string $model = CartLine::class;

    protected int $maxDepth = 3;

    public function fields(): array
    {
        return [
            ID::make(),
            Number::make('quantity'),
            Str::make('purchasableType', 'purchasable_type'),
            Number::make('purchasableId', 'purchasable_id'),
            Number::make('unitPriceAmount', 'unit_price_amount')->readOnly(),
            BelongsTo::make('cart')->type('carts'),
            HasMany::make('adjustments')->type('cart-line-adjustments'),
            HasMany::make('taxLines')->type('cart-line-tax-lines'),
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
        return $q->whereHas('cart', fn ($c) => $c->where('customer_id', $id));
    }
}
