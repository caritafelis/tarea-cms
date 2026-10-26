<?php

namespace App\JsonApi\V1\Orders;

use App\Models\Order;
use LaravelJsonApi\Eloquent\Contracts\Paginator;
use LaravelJsonApi\Eloquent\Fields\DateTime;
use LaravelJsonApi\Eloquent\Fields\ID;
use LaravelJsonApi\Eloquent\Fields\Number;
use LaravelJsonApi\Eloquent\Fields\Relations\BelongsTo;
use LaravelJsonApi\Eloquent\Fields\Relations\HasMany;
use LaravelJsonApi\Eloquent\Fields\Str;
use LaravelJsonApi\Eloquent\Filters\Where;
use LaravelJsonApi\Eloquent\Filters\WhereIdIn;
use LaravelJsonApi\Eloquent\Pagination\PagePagination;
use App\JsonApi\Concerns\ScopesToOwner;
use Illuminate\Database\Eloquent\Builder;
use LaravelJsonApi\Eloquent\Schema;

class OrderSchema extends Schema
{
    use ScopesToOwner;

    public static string $model = Order::class;

    protected int $maxDepth = 3;

    public function fields(): array
    {
        return [
            ID::make(),
            Str::make('number'),
            Number::make('priceAmount', 'price_amount'),
            Number::make('taxAmount', 'tax_amount'),
            Str::make('status'),
            Str::make('paymentStatus', 'payment_status'),
            Str::make('shippingStatus', 'shipping_status'),
            Str::make('currencyCode', 'currency_code'),
            Str::make('notes'),
            Str::make('discountCode', 'discount_code'),
            DateTime::make('cancelledAt', 'cancelled_at'),
            DateTime::make('archivedAt', 'archived_at'),
            BelongsTo::make('customer')->type('users'),
            BelongsTo::make('channel')->type('channels'),
            BelongsTo::make('zone')->type('zones'),
            BelongsTo::make('paymentMethod')->type('payment-methods'),
            BelongsTo::make('billingAddress')->type('order-addresses'),
            BelongsTo::make('shippingAddress')->type('order-addresses'),
            HasMany::make('items')->type('order-items'),
            HasMany::make('shipments')->type('order-shippings'),
            HasMany::make('taxLines')->type('order-tax-lines'),
            DateTime::make('createdAt')->sortable()->readOnly(),
            DateTime::make('updatedAt')->sortable()->readOnly(),
        ];
    }

    public function filters(): array
    {
        return [
            WhereIdIn::make($this),
            Where::make('status'),
            Where::make('paymentStatus', 'payment_status'),
        ];
    }

    public function pagination(): ?Paginator
    {
        return PagePagination::make()->withDefaultPerPage(25);
    }

    protected function bypassPermission(): string {
        return 'view_any_order';
    }
    protected function ownedBy(Builder $q, int|string $id): Builder {
        return $q->where('customer_id', $id);
    }
}
