<?php

use App\Providers\AppServiceProvider;
use App\Providers\EventServiceProvider;
use App\Providers\FortifyServiceProvider;
use App\Providers\PaymentServiceProvider;
use App\Providers\ShippingServiceProvider;
use App\Providers\ShopServiceProvider;
use App\Providers\PlanLimitsServiceProvider;
use App\Providers\WebhookEventsServiceProvider;
use Nuwave\Lighthouse\Subscriptions\SubscriptionServiceProvider;
use Resend\Laravel\ResendServiceProvider;

return [
    AppServiceProvider::class,
    EventServiceProvider::class,
    FortifyServiceProvider::class,
    ShopServiceProvider::class,
    ShippingServiceProvider::class,
    PaymentServiceProvider::class,
    ResendServiceProvider::class,
    SubscriptionServiceProvider::class,
    PlanLimitsServiceProvider::class,
    WebhookEventsServiceProvider::class,
];
