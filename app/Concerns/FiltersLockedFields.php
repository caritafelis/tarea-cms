<?php

namespace App\Http\Requests\Concerns;

use App\Support\Entitlements;

trait FiltersLockedFields
{
    abstract protected function entitlementResource(): string;

    public function validated($key = null, $default = null)
    {
        $data = Entitlements::filter(
            $this->user()?->currentTeam,
            $this->entitlementResource(),
            parent::validated(),
        );

        return $key === null ? $data : data_get($data, $key, $default);
    }
}