<?php

namespace App\JsonApi\V1\ProductVariants;

use App\Models\ProductVariant;
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

class ProductVariantSchema extends Schema
{
    public static string $model = ProductVariant::class;

    protected int $maxDepth = 3;

    public function fields(): array
    {
        return [
            ID::make(),
            Str::make('name'),
            Str::make('sku'),
            Str::make('barcode'),
            Str::make('ean'),
            Str::make('upc'),
            Boolean::make('allowBackorder', 'allow_backorder'),
            Number::make('position'),
            Number::make('weight'),
            Number::make('height'),
            Number::make('width'),
            Number::make('length'),
            BelongsTo::make('product')->type('products'),
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
