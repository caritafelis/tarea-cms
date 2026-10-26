<?php

namespace App\Concerns;

use App\Models\ExternalId;
use Illuminate\Database\Eloquent\Relations\MorphMany;

trait HasExternalIds
{
    public function externalIds(): MorphMany
    {
        return $this->morphMany(ExternalId::class, 'syncable');
    }

    public function externalIdFor(string $platform): ?string
    {
        return $this->externalIds()->where('platform', $platform)->value('external_id');
    }
}