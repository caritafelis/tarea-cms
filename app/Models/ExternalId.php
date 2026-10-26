<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ExternalId extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['payload' => 'array', 'last_synced_at' => 'datetime'];
    }

    public function syncable(): MorphTo
    {
        return $this->morphTo();
    }
}