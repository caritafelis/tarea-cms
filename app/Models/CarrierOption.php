<?php

namespace App\Models;

use Database\Factories\CarrierOptionFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CarrierOption extends Model
{
    /** @use HasFactory<CarrierOptionFactory> */
    use HasFactory;

    protected $guarded = [];

    public function isEnabled(): bool
    {
        return $this->is_enabled;
    }

    /**
     * @param  Builder<CarrierOption>  $query
     * @return Builder<CarrierOption>
     */
    public function scopeEnabled(Builder $query): Builder
    {
        return $query->where('is_enabled', true);
    }

    /**
     * @return BelongsTo<Carrier, $this>
     */
    public function carrier(): BelongsTo
    {
        return $this->belongsTo(Carrier::class, 'carrier_id');
    }

    /**
     * @return BelongsTo<Zone, $this>
     */
    public function zone(): BelongsTo
    {
        return $this->belongsTo(Zone::class, 'zone_id');
    }

    protected static function newFactory(): CarrierOptionFactory
    {
        return CarrierOptionFactory::new();
    }

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'is_enabled' => 'boolean',
        ];
    }
}
