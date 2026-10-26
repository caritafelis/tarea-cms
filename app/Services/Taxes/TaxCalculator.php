<?php

namespace App\Services\Taxes;

use App\Contracts\TaxableItem;
use App\Contracts\TaxCalculationProvider;
use App\Models\TaxZone;
use App\Models\Product;

final class TaxCalculator
{
    /** @var array<string, TaxCalculationProvider> */
    private array $providerCache = [];

    /** @var array<string, ?TaxZone> */
    private array $zoneCache = [];

    private array $productCache = [];

    public function __construct(
        private readonly TaxCalculationProvider $defaultProvider,
    ) {}
    
    public function calculate(TaxableItem $item, TaxCalculationContext $context): array
    {
        $product = $this->productFor($item);

        if ($product && in_array($product->tax_status, ['none', 'shipping'], true)) {
            return [];
        }

        $enriched = $this->enrichContext($context);
        $lines = $this->resolveProvider($enriched)->getTaxLines($item, $enriched);

        if ($product && filled($product->tax_class)) {
            $lines = array_values(array_filter(
                $lines,
                fn (TaxLine $l): bool => strcasecmp((string) ($l->code ?? ''), $product->tax_class) === 0,
            ));
        }

        return $lines;
    }
    
    public function calculateMany(array $items, TaxCalculationContext $context): array
    {
        return array_map(fn (TaxableItem $item): array => $this->calculate($item, $context), $items);
    }

    private function productFor(TaxableItem $item): ?Product
    {
        $id = $item->getProductId();

        return $id ? ($this->productCache[$id] ??= Product::find($id)) : null;
    }

    public function resolveZone(TaxCalculationContext $context): ?TaxZone
    {
        $key = $context->cacheKey();

        if (array_key_exists($key, $this->zoneCache)) {
            return $this->zoneCache[$key];
        }

        if ($context->provinceCode) {
            $zone = resolve(TaxZone::class)::query()
                ->whereHas('country', fn ($q) => $q->where('cca2', $context->countryCode))
                ->where('province_code', $context->provinceCode)
                ->first();

            if ($zone) {
                return $this->zoneCache[$key] = $zone;
            }
        }

        return $this->zoneCache[$key] = resolve(TaxZone::class)::query()
            ->whereHas('country', fn ($q) => $q->where('cca2', $context->countryCode))
            ->whereNull('province_code')
            ->first();
    }

    private function enrichContext(TaxCalculationContext $context): TaxCalculationContext
    {
        if ($context->resolvedZone) {
            return $context;
        }

        $zone = $this->resolveZone($context);

        return new TaxCalculationContext(
            countryCode: $context->countryCode,
            provinceCode: $context->provinceCode,
            customerId: $context->customerId,
            resolvedZone: $zone,
        );
    }

    private function resolveProvider(TaxCalculationContext $context): TaxCalculationProvider
    {
        $key = $context->cacheKey();

        if (isset($this->providerCache[$key])) {
            return $this->providerCache[$key];
        }

        $taxZone = $context->resolvedZone;

        if ($taxZone?->provider_id) {
            $providerModel = $taxZone->provider;

            if ($providerModel?->isEnabled()) {
                return $this->providerCache[$key] = app()->make(
                    TaxCalculationProvider::class,
                    ['provider' => $providerModel->identifier],
                );
            }
        }

        return $this->providerCache[$key] = $this->defaultProvider;
    }
}
