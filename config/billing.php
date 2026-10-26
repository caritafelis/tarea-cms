
<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Billing
    |--------------------------------------------------------------------------
    */

    'default_gateway' => env('BILLING_DEFAULT_GATEWAY', 'nuvei'),
    'environment' => env('BILLING_ENVIRONMENT', 'sandbox'),
    'plan_sync_gateways' => array_values(array_filter(
        array_map(
            'trim',
            explode(
                ',',
                env('BILLING_PLAN_SYNC_GATEWAYS', 'stripe,paypal,nuvei')
            )
        )
    )),

    'vat_percentage' => 15,

    'gateways' => [
        'stripe' => [
            'secret_key' => env('STRIPE_SECRET'),
            'public_key' => env('STRIPE_KEY'),
            'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
        ],

        'paypal' => [
            'mode' => env('PAYPAL_MODE', 'sandbox'),
            'client_id' => env('PAYPAL_CLIENT_ID'),
            'client_secret' => env('PAYPAL_CLIENT_SECRET'),
            'webhook_id' => env('PAYPAL_WEBHOOK_ID'),

            'base_url' => env(
                'PAYPAL_MODE',
                'sandbox'
            ) === 'live'
                ? 'https://api-m.paypal.com'
                : 'https://api-m.sandbox.paypal.com',
        ],

        'nuvei' => [
            // Paymentez Ecuador: API de tarjetas.
            'api_url' => env(
                'NUVEI_API_URL',
                'https://ccapi-stg.paymentez.com'
            ),

            'js_env' => env('NUVEI_JS_ENV', 'stg'),

            'client_code' => env('NUVEI_CLIENT_CODE'),
            'client_key' => env('NUVEI_CLIENT_KEY'),

            'server_code' => env('NUVEI_SERVER_CODE'),
            'server_key' => env('NUVEI_SERVER_KEY'),

            // No confundir las credenciales de tarjetas con las
            // credenciales independientes de Link To Pay.
            'link_to_pay_url' => env(
                'NUVEI_LINK_TO_PAY_URL',
                'https://noccapi-stg.paymentez.com/linktopay/init_order/'
            ),
            'link_to_pay_client_code' => env('NUVEI_LINKTOPAY_CLIENT_CODE'),
            'link_to_pay_server_key' => env('NUVEI_LINKTOPAY_SERVER_KEY'),

            // URL pública que recibirá las notificaciones del proveedor.
            'webhook_url' => env('NUVEI_WEBHOOK_URL'),
        ],
    ],
];