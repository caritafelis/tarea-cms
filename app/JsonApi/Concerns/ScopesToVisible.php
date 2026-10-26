<?php

namespace App\JsonApi\Concerns;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

trait ScopesToVisible
{
    abstract protected function bypassPermission(): string;

    abstract protected function visible(Builder $query): Builder;

    public function indexQuery(?Request $request, Builder $query): Builder
    {
        return $this->scopeFor($request, $query);
    }

    public function readQuery(?Request $request, Builder $query): Builder
    {
        return $this->scopeFor($request, $query);
    }

    private function scopeFor(?Request $request, Builder $query): Builder
    {
        if ($request?->attributes->get('api_key_scoped')) {
            return $this->visible($query);
        }

        return $request?->user()?->can($this->bypassPermission())
            ? $query
            : $this->visible($query);
    }
}
