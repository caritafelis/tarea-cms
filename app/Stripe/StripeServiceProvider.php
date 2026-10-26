<?php

namespace App\Stripe;

use App\Facades\Payment;
use Illuminate\Support\ServiceProvider;

final class StripeServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__.'/../config/stripe.php', 'shopper.stripe');
    }

    public function boot(): void
    {
        $this->publishes([
            __DIR__.'/../config/stripe.php' => config_path('shopper/stripe.php'),
        ], 'shopper-stripe-config');

        Payment::extend('stripe', fn (): StripeDriver => new StripeDriver(
            secretKey: (string) config('stripe.secret_key'),
            publishableKey: (string) config('stripe.publishable_key'),
            webhookSecret: (string) config('stripe.webhook_secret'),
            captureMethod: (string) config('stripe.capture_method', 'manual'),
        ));
    }
}
