<?php

namespace App\JsonApi\V1\OrderItems;

use App\Models\OrderItem;
use LaravelJsonApi\Eloquent\Contracts\Paginator;
use LaravelJsonApi\Eloquent\Fields\DateTime;
use LaravelJsonApi\Eloquent\Fields\ID;
use LaravelJsonApi\Eloquent\Fields\Number;
use LaravelJsonApi\Eloquent\Fields\Relations\BelongsTo;
use LaravelJsonApi\Eloquent\Fields\Str;
use LaravelJsonApi\Eloquent\Fields\ArrayHash;
use LaravelJsonApi\Eloquent\Filters\WhereIdIn;
use LaravelJsonApi\Eloquent\Pagination\PagePagination;
use LaravelJsonApi\Eloquent\Schema;


class OrderItemSchema extends Schema
{
    public static string $model = OrderItem::class;

    protected int $maxDepth = 3;

    public function fields(): array
    {
        return [
            ID::make(),
            Str::make('name'),
            Str::make('sku'),
            Number::make('quantity'),
            Number::make('unitPriceAmount', 'unit_price_amount'),
            Number::make('taxAmount', 'tax_amount'),
            Number::make('discountAmount', 'discount_amount'),
            Str::make('fulfillmentStatus', 'fulfillment_status'),
            BelongsTo::make('order')->type('orders'),
            DateTime::make('createdAt')->sortable()->readOnly(),
            DateTime::make('updatedAt')->sortable()->readOnly(),
            Str::make('purchaseNote', 'purchase_note')->readOnly(),
            ArrayHash::make('downloads')->readOnly(),
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
