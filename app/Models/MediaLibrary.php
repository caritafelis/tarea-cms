<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media as SpatieMedia;

class MediaLibrary extends Model implements HasMedia
{
    use InteractsWithMedia;

    protected $guarded = [];

    protected $casts = [
        'manipulations' => 'array',
        'custom_properties' => 'array',
        'generated_conversions' => 'array',
        'responsive_images' => 'array',
    ];

    public function registerMediaConversions(?SpatieMedia $media = null): void
    {
        $crop = $media?->getCustomProperty('crop');

        if ($crop) {
            $this
                ->addMediaConversion('thumb')
                ->manualCrop(
                    (int) $crop['width'],
                    (int) $crop['height'],
                    (int) $crop['x'],
                    (int) $crop['y']
                )
                ->width(300)
                ->height(300)
                ->format('webp')
                ->queued();
        } else {
            $this
                ->addMediaConversion('thumb')
                ->width(300)
                ->height(300)
                ->sharpen(10)
                ->format('webp')
                ->queued();
        }

        $this
            ->addMediaConversion('large')
            ->width(1600)
            ->format('webp')
            ->queued();

        $this
            ->addMediaConversion('webp')
            ->format('webp')
            ->queued();
    }
}
