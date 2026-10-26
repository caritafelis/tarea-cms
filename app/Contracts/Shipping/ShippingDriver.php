<?php

namespace App\Contracts\Shipping;

use App\DTOs\Shipping\Address;
use App\DTOs\Shipping\Package;
use App\DTOs\Shipping\Shipment;
use App\DTOs\Shipping\ShippingRate;
use App\DTOs\Shipping\TrackingInfo;
use Illuminate\Support\Collection;

interface ShippingDriver
{
    public function code(): string;

    public function name(): string;

    public function logo(): ?string;

    public function isConfigured(): bool;

    public function supportsRealTimeRates(): bool;

    public function supportsLabels(): bool;

    public function supportsTracking(): bool;

    /**
     * Calculate shipping rates.
     *
     * @param  array<int, Package>  $packages
     * @return Collection<int, ShippingRate>
     */
    public function calculateRates(Address $from, Address $to, array $packages): Collection;

    /**
     * Create a shipment and get label.
     *
     * @param  array<int, Package>  $packages
     */
    public function createShipment(
        Address $from,
        Address $to,
        array $packages,
        string $serviceCode
    ): Shipment;

    /**
     * Track a shipment by tracking number.
     */
    public function track(string $trackingNumber): TrackingInfo;
}
