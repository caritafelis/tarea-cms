<?php

namespace App\JsonApi\V1\Settings;

use App\Models\Setting;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use LaravelJsonApi\Eloquent\Contracts\Paginator;
use LaravelJsonApi\Eloquent\Fields\ID;
use LaravelJsonApi\Eloquent\Fields\Str;
use LaravelJsonApi\Eloquent\Filters\Where;
use LaravelJsonApi\Eloquent\Filters\WhereIdIn;
use LaravelJsonApi\Eloquent\Pagination\PagePagination;
use LaravelJsonApi\Eloquent\Schema;

class SettingSchema extends Schema
{
    public static string $model = Setting::class;

    public function fields(): array
    {
        return [
            ID::make(),
            Str::make('key')->readOnly(),
            Str::make('group')->readOnly(),
            Str::make('value')->extractUsing(
                fn ($model, $column, $value) => is_string($value) ? $value : json_encode($value)
            ),
        ];
    }

    public function filters(): array
    {
        return [WhereIdIn::make($this), Where::make('key'), Where::make('group')];
    }

    // Solo ajustes marcados is_public; los internos (credenciales, etc.) nunca salen por la API.
    public function indexQuery(?Request $request, Builder $query): Builder
    {
        return $query->where('is_public', true);
    }

    public function readQuery(?Request $request, Builder $query): Builder
    {
        return $query->where('is_public', true);
    }

    public function pagination(): ?Paginator
    {
        return PagePagination::make()->withDefaultPerPage(100);
    }
}
