<?php

namespace App\Models;

use App\Concerns\Core\HasZones;
use App\Concerns\HasSlug;
use Database\Factories\PaymentMethodFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentMethod extends Model
{
    /** @use HasFactory<PaymentMethodFactory> */
    use HasFactory;

    use HasSlug;
    use HasZones;

    protected $guarded = [];

    /**
     * @param  Builder<PaymentMethod>  $query
     * @return Builder<PaymentMethod>
     */
    public function scopeEnabled(Builder $query): Builder
    {
        return $query->where('is_enabled', true);
    }

    public function logo(): ?string
    {
        if (! app()->bound('payment.logo')) {
            return null;
        }

        /** @var callable(static): ?string $resolver */
        $resolver = app('payment.logo');

        return $resolver($this);
    }

    protected static function newFactory(): PaymentMethodFactory
    {
        return PaymentMethodFactory::new();
    }

    protected function casts(): array
    {
        return [
            'is_enabled' => 'boolean',
        ];
    }
}
