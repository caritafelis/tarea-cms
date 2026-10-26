<?php

namespace App\Concerns;

use Illuminate\Contracts\Support\Htmlable;

interface HasLabel
{
    public function getLabel(): string|Htmlable|null;
}
