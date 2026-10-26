<?php

namespace App\JsonApi\V1\Products;

use App\JsonApi\Concerns\ScopesToVisible;
use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use LaravelJsonApi\Eloquent\Contracts\Paginator;
use LaravelJsonApi\Eloquent\Fields\ArrayHash;
use LaravelJsonApi\Eloquent\Fields\Boolean;
use LaravelJsonApi\Eloquent\Fields\DateTime;
use LaravelJsonApi\Eloquent\Fields\ID;
use LaravelJsonApi\Eloquent\Fields\Number;
use LaravelJsonApi\Eloquent\Fields\Relations\BelongsTo;
use LaravelJsonApi\Eloquent\Fields\Relations\HasMany;
use LaravelJsonApi\Eloquent\Fields\Str;
use LaravelJsonApi\Eloquent\Filters\Where;
use LaravelJsonApi\Eloquent\Filters\WhereIdIn;
use LaravelJsonApi\Eloquent\Filters\WhereIn;
use LaravelJsonApi\Eloquent\Pagination\PagePagination;
use LaravelJsonApi\Eloquent\Schema;

class ProductSchema extends Schema
{
    use ScopesToVisible;

    public static string $model = Product::class;

    protected int $maxDepth = 3;

    public function fields(): array
    {
        return [
            ID::make(),
            Str::make('name'),
            Str::make('slug'),
            Str::make('sku'),
            Str::make('barcode'),
            Str::make('gtin'),
            Str::make('mpn'),
            Str::make('description'),
            Str::make('summary'),
            Number::make('securityStock', 'security_stock'),
            Boolean::make('featured'),
            Boolean::make('isVisible', 'is_visible'),
            Boolean::make('allowBackorder', 'allow_backorder'),
            Str::make('type'),
            ArrayHash::make('sections', 'dynamic_fields'),
            DateTime::make('publishedAt', 'published_at')->sortable(),
            Number::make('weight'),
            Number::make('height'),
            Number::make('width'),
            Number::make('length'),
            BelongsTo::make('brand')->type('brands'),
            BelongsTo::make('supplier')->type('suppliers'),
            HasMany::make('categories')->type('categories'),
            Boolean::make('manageStock', 'manage_stock'),
            Str::make('stockStatus', 'stock_status'),
            Number::make('minQty', 'min_qty'),
            Number::make('maxQty', 'max_qty'),
            Boolean::make('soldIndividually', 'sold_individually'),
            Str::make('taxStatus', 'tax_status'),
            Str::make('taxClass', 'tax_class'),
            Boolean::make('shippingEnabled', 'shipping_enabled'),
            Boolean::make('shippingFree', 'shipping_free'),
            Boolean::make('shipInternationally', 'ship_internationally'),
            Boolean::make('shippingRequiresBox', 'shipping_requires_box'),
            Str::make('shippingClass', 'shipping_class'),
            Str::make('shippingOriginCountry', 'shipping_origin_country'),
            Str::make('catalogVisibility', 'catalog_visibility'),
            Number::make('menuOrder', 'menu_order')->sortable(),
            Boolean::make('enableReviews', 'enable_reviews'),
            ArrayHash::make('pricing'),
            ArrayHash::make('seo'),
            HasMany::make('upsells')->type('products')->readOnly(),
            HasMany::make('crossSells')->type('products')->readOnly(),
            DateTime::make('createdAt')->sortable()->readOnly(),
            DateTime::make('updatedAt')->sortable()->readOnly(),
        ];
    }

    public function filters(): array
    {
        return [
            WhereIdIn::make($this), 
            Where::make('slug'), 
            Where::make('sku'), 
            Where::make('featured'),
            Where::make('type'),
            Where::make('brand_id'),
            Where::make('supplier_id'),
            WhereIn::make('catalogVisibility', 'catalog_visibility'),
            Where::make('taxStatus', 'tax_status'),
            Where::make('taxClass', 'tax_class'),
            Where::make('shippingClass', 'shipping_class'),
            Where::make('shippingOriginCountry', 'shipping_origin_country'),
            Where::make('manageStock', 'manage_stock'),
            Where::make('stockStatus', 'stock_status'),
            Where::make('soldIndividually', 'sold_individually'),
            Where::make('shippingEnabled', 'shipping_enabled'),
            Where::make('shippingFree', 'shipping_free'),
            Where::make('shipInternationally', 'ship_internationally'),
            Where::make('shippingRequiresBox', 'shipping_requires_box'),
            Where::make('enableReviews', 'enable_reviews'),
            Where::make('featured'),
            Where::make('onSale', 'on_sale'),
            Where::make('onSpecial', 'on_special'),
            Where::make('onClearance', 'on_clearance'),
            Where::make('onBackorder', 'on_backorder'),
            Where::make('onPreorder', 'on_preorder'),
            Where::make('onNew', 'on_new'),
            Where::make('onSale', 'on_sale'),
            Where::make('onSpecial', 'on_special'),
            Where::make('onClearance', 'on_clearance'),
            Where::make('onBackorder', 'on_backorder'),
            Where::make('onPreorder', 'on_preorder'),
            Where::make('onNew', 'on_new'),
        ];
    }

    protected function bypassPermission(): string
    {
        return 'view_any_product';
    }

    protected function visible(Builder $query): Builder
    {
        return $query->where('is_visible', true)
            ->where(fn ($q) => $q->whereNull('published_at')->orWhere('published_at', '<=', now()));
    }

    public function pagination(): ?Paginator
    {
        return PagePagination::make()->withDefaultPerPage(25);
    }
}
