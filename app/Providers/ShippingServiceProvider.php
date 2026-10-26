<?php

namespace App\Providers;

use App\Facades\Shipping;
use App\Models\Carrier;
use App\Services\Shipping\CarrierRateService;
use App\Services\Shipping\ShippingManager;
use Closure;
use Illuminate\Support\ServiceProvider;

final class ShippingServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(base_path('config/shipping.php'), 'shipping');

        $this->app->singleton(ShippingManager::class, fn (): ShippingManager => new ShippingManager);
        $this->app->singleton(CarrierRateService::class);

        $this->app->bind(
            'carrier.logo',
            fn (): Closure => fn (Carrier $carrier): ?string => Shipping::driver($carrier->driver ?? 'manual')->logo()
        );
    }

    public function boot(): void
    {
        $this->publishes([
            base_path('config/shipping.php') => config_path('shipping.php'),
        ], 'shop-config');
    }
}
