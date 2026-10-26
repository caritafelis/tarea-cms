<?php

namespace App\Providers;

use App\Facades\Payment;
use App\Models\Order;
use App\Models\Payment\PaymentTransaction;
use App\Models\PaymentMethod;
use App\Services\Payment\PaymentManager;
use App\Services\Payment\PaymentProcessingService;
use Closure;
use Illuminate\Support\ServiceProvider;

final class PaymentServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(base_path('config/payment.php'), 'payment');

        $this->app->singleton(PaymentManager::class, fn (): PaymentManager => new PaymentManager);
        $this->app->singleton(PaymentProcessingService::class);

        $this->app->bind(
            'payment.logo',
            fn (): Closure => fn (PaymentMethod $method): ?string => Payment::driver($method->driver ?? 'manual')->logo()
        );
    }

    public function boot(): void
    {
        $this->loadMigrationsFrom(__DIR__.'/../database/migrations');

        $this->publishes([
            base_path('config/payment.php') => config_path('payment.php'),
        ], 'shop-config');

        Order::resolveRelationUsing('paymentTransactions', fn (Order $order) => $order->hasMany(PaymentTransaction::class, 'order_id'));
    }
}
