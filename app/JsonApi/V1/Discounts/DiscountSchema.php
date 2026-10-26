<?php

namespace App\JsonApi\V1\Discounts;

use App\Models\Discount;
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

class DiscountSchema extends Schema
{
    /**
     * The model the schema corresponds to.
     */
    public static string $model = Discount::class;

    /**
     * The maximum depth of include paths.
     */
    protected int $maxDepth = 3;

    /**
     * Get the resource fields.
     */
    public function fields(): array
    {
        return [
            ID::make(),
            Boolean::make('isActive', 'is_active'),
            Str::make('code'),
            Str::make('type'),
            Number::make('value'),
            Str::make('applyTo', 'apply_to'),
            Str::make('minRequired', 'min_required'),
            Str::make('minRequiredValue', 'min_required_value'),
            Str::make('eligibility'),
            Number::make('usageLimit', 'usage_limit'),
            Boolean::make('usageLimitPerUser', 'usage_limit_per_user'),
            Number::make('totalUse', 'total_use'),
            DateTime::make('startAt', 'start_at'),
            DateTime::make('endAt', 'end_at'),
            BelongsTo::make('zone')->type('zones'),
            DateTime::make('createdAt')->sortable()->readOnly(),
            DateTime::make('updatedAt')->sortable()->readOnly(),
        ];
    }

    /**
     * Get the resource filters.
     */
    public function filters(): array
    {
        return [
            WhereIdIn::make($this),
        ];
    }

    /**
     * Get the resource paginator.
     */
    public function pagination(): ?Paginator
    {
        return PagePagination::make()->withDefaultPerPage(25);
    }
}
