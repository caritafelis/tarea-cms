<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Payment Drivers
    |--------------------------------------------------------------------------
    |
    | Configure payment provider drivers. Each driver connects to a payment
    | gateway API (Stripe, PayPal, etc.) for processing payments,
    | captures, and refunds.
    |
    | Credentials should be stored in your .env file, never in the database.
    |
    */

    'drivers' => [

        'stripe' => [
            'enabled' => env('PAYMENT_STRIPE_ENABLED', false),
            'sandbox' => env('PAYMENT_SANDBOX', false),
            'credentials' => [
                'secret_key' => env('STRIPE_SECRET_KEY'),
                'publishable_key' => env('STRIPE_PUBLISHABLE_KEY'),
                'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
            ],
        ],

        'paypal' => [
            'enabled' => env('PAYMENT_PAYPAL_ENABLED', false),
            'sandbox' => env('PAYMENT_SANDBOX', false),
            'credentials' => [
                'client_id' => env('PAYPAL_CLIENT_ID'),
                'client_secret' => env('PAYPAL_CLIENT_SECRET'),
                'webhook_id' => env('PAYPAL_WEBHOOK_ID'),
            ],
        ],

        'nuvei' => [
            'enabled' => env('PAYMENT_NUVEI_ENABLED', false),
            'sandbox' => env('PAYMENT_SANDBOX', false),
            'credentials' => [
                'merchant_id' => env('NUVEI_MERCHANT_ID'),
                'merchant_site_id' => env('NUVEI_MERCHANT_SITE_ID'),
                'secret_key' => env('NUVEI_SECRET_KEY'),
                'webhook_secret' => env('NUVEI_WEBHOOK_SECRET'),
            ],
        ],

    ],

];
