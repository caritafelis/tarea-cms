<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Plan extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'gateway_ids' => 'array',
            'features' => 'array',
            'entitlements' => 'array',
            'has_ecommerce' => 'boolean',
            'is_active' => 'boolean',
            'price_cents' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function gatewaySyncs(): HasMany
    {
        return $this->hasMany(PlanGatewaySync::class);
    }

    public function formattedPrice(): string
    {
        $amount = number_format($this->price_cents / 100, 2);

        return match (strtolower($this->currency)) {
            'usd' => "\${$amount}",
            'eur' => "€{$amount}",
            default => strtoupper($this->currency).' '.$amount,
        };
    }

    public function gatewayIdentifier(
        string $gateway,
        string $identifier
    ): ?string {
        $gateway = strtolower($gateway);

        $sync = $this->gatewaySyncs()
            ->where('gateway', $gateway)
            ->where('environment', \App\Services\Billing\PlanGatewaySyncService::environmentFor($gateway))
            ->where('status', 'synced')
            ->first();

        if ($sync) {
            $value = match ($identifier) {
                'product_id' => $sync->external_product_id,
                'plan_id' => $sync->external_plan_id,
                'price_id' => $sync->external_price_id,
                default => null,
            };

            if (is_string($value) && $value !== '') {
                return $value;
            }
        }

        $value = data_get($this->gateway_ids, "{$gateway}.{$identifier}");

        return is_string($value) && $value !== '' ? $value : null;
    }

    public function gatewayPriceId(?string $gateway = null): ?string
    {
        $gateway = strtolower($gateway ?? $this->gateway);

        $identifier = match ($gateway) {
            'stripe' => $this->gatewayIdentifier('stripe', 'price_id'),
            'paypal' => $this->gatewayIdentifier('paypal', 'plan_id'),
            'nuvei' => $this->gatewayIdentifier('nuvei', 'plan_id'),
            default => null,
        };

        if ($identifier !== null) {
            return $identifier;
        }

        if ($this->gateway === $gateway) {
            $legacyId = $this->getAttribute('gateway_price_id');

            return is_string($legacyId) && $legacyId !== ''
                ? $legacyId
                : null;
        }

        return null;
    }
}