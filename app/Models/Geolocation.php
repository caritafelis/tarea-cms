<?php

namespace App\Models;

use App\Models\User as ShopperUser;
use Database\Factories\GeolocationFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Geolocation extends Model
{
    /** @use HasFactory<GeolocationFactory> */
    use HasFactory;

    use SoftDeletes;

    protected $guarded = [];

    /**
     * @return BelongsTo<Model&ShopperUser, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(ShopperUser::class, 'user_id');
    }

    /**
     * @return BelongsTo<Order, $this>
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    protected static function newFactory(): GeolocationFactory
    {
        return GeolocationFactory::new();
    }

    protected function casts(): array
    {
        return [
            'extreme_ip_lookup' => 'json',
            'ip_api' => 'json',
        ];
    }
}
