<?php

namespace App\JsonApi\Concerns;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

trait ScopesToOwner
{
    abstract protected function bypassPermission(): string;

    abstract protected function ownedBy(Builder $query, int|string $userId): Builder;

    public function indexQuery(?Request $request, Builder $query): Builder
    {
        return $this->scopeOwner($request, $query);
    }

    public function readQuery(?Request $request, Builder $query): Builder
    {
        return $this->scopeOwner($request, $query);
    }

    private function scopeOwner(?Request $request, Builder $query): Builder
    {
        $user = $request?->user();

        if (! $user) {
            return $query->whereRaw('1 = 0');
        }

        // SuperAdmin pasa por Gate::before; Owner/Admin con permiso ven todo.
        return $user->can($this->bypassPermission())
            ? $query
            : $this->ownedBy($query, $user->getKey());
    }
}