<?php

namespace App\Observers;

use App\Models\Attribute;

class AttributeObserver
{
    public function deleting(Attribute $attribute): void
    {
        $attribute->products()->detach();
        $attribute->values()->delete();
    }
}
