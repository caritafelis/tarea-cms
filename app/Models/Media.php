<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\MediaLibrary\MediaCollections\Models\Media as BaseMedia;

class Media extends BaseMedia
{
    protected $guarded = [];

    protected function casts(): array
    {
        return array_merge(parent::casts(), [
            'custom_properties' => 'array',
        ]);
    }

    public function getAltAttribute(): ?string
    {
        return $this->getCustomProperty('alt');
    }

    public function getCaptionAttribute(): ?string
    {
        return $this->getCustomProperty('caption');
    }

    public function getTitleAttribute(): ?string
    {
        return $this->getCustomProperty('title');
    }

    public function folder(): BelongsTo
    {
        return $this->belongsTo(MediaFolder::class, 'folder_id');
    }
}
