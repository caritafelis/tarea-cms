<?php

namespace App\Concerns\Core;

use App\Models\Zone;
use Illuminate\Database\Eloquent\Relations\MorphToMany;

trait HasZones
{
    /**
     * @return MorphToMany<Zone, $this>
     */
    public function zones(): MorphToMany
    {
        return $this->morphToMany(Zone::class, 'zonable', shopper_table('zone_has_relations'));
    }
}
