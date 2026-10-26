<?php

namespace App\Models;

use App\Enums\AddressType;
use App\Models\User as ShopperUser;
use Database\Factories\AddressFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Address extends Model
{
    /** @use HasFactory<AddressFactory> */
    use HasFactory;

    protected $guarded = [];

    // Definimos la tabla de manera directa y nativa sin funciones externas
    protected $table = 'user_addresses';

    public function isShippingDefault(): bool
    {
        return $this->shipping_default === true;
    }

    public function isBillingDefault(): bool
    {
        return $this->billing_default === true;
    }

    /**
     * @return BelongsTo<Model&ShopperUser, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(ShopperUser::class, 'user_id');
    }

    /**
     * @return BelongsTo<Country, $this>
     */
    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class, 'country_id');
    }

    protected static function newFactory(): AddressFactory
    {
        return AddressFactory::new();
    }

    protected function casts(): array
    {
        return [
            'billing_default' => 'boolean',
            'shipping_default' => 'boolean',
            'type' => AddressType::class,
        ];
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
