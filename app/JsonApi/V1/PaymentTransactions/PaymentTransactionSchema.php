<?php

namespace App\JsonApi\V1\PaymentTransactions;

use App\Models\Payment\PaymentTransaction;
use LaravelJsonApi\Eloquent\Contracts\Paginator;
use LaravelJsonApi\Eloquent\Fields\DateTime;
use LaravelJsonApi\Eloquent\Fields\ID;
use LaravelJsonApi\Eloquent\Fields\Number;
use LaravelJsonApi\Eloquent\Fields\Relations\BelongsTo;
use LaravelJsonApi\Eloquent\Fields\Str;
use LaravelJsonApi\Eloquent\Filters\WhereIdIn;
use LaravelJsonApi\Eloquent\Pagination\PagePagination;
use LaravelJsonApi\Eloquent\Schema;

class PaymentTransactionSchema extends Schema
{
    public static string $model = PaymentTransaction::class;

    protected int $maxDepth = 3;

    public function fields(): array
    {
        return [
            ID::make(),
            Str::make('driver'),
            Str::make('type'),
            Str::make('status'),
            Number::make('amount'),
            Str::make('currencyCode', 'currency_code'),
            Str::make('reference'),
            Str::make('notes'),
            BelongsTo::make('order')->type('orders'),
            BelongsTo::make('paymentMethod')->type('payment-methods'),
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
