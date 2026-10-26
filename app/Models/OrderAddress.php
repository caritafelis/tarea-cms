<?php

namespace App\Models;

use App\Models\User as ShopperUser;
use Database\Factories\OrderAddressFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OrderAddress extends Model
{
    /** @use HasFactory<OrderAddressFactory> */
    use HasFactory;

    protected $guarded = [];

    /**
     * @return HasMany<Order, $this>
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /**
     * @return BelongsTo<Model&ShopperUser, $this>
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(ShopperUser::class, 'customer_id');
    }

    protected static function newFactory(): OrderAddressFactory
    {
        return OrderAddressFactory::new();
    }

    protected function fullName(): Attribute
    {
        return Attribute::make(
            get: fn (): string => $this->first_name
            ? implode(' ', [$this->first_name, $this->last_name])
            : $this->last_name
        );
    }
}
