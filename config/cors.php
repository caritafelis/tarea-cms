
<?php

return [

    'paths' => [
        'api/*',
        'graphql',
        'sanctum/csrf-cookie',
    ],

    'allowed_methods' => [
        'GET',
        'POST',
        'PUT',
        'PATCH',
        'DELETE',
        'OPTIONS',
    ],

    'allowed_origins' => array_values(array_filter(
        array_map(
            'trim',
            explode(',', env('CORS_ALLOWED_ORIGINS', ''))
        )
    )),

    'allowed_origins_patterns' => [],

    'allowed_headers' => [
        'Accept',
        'Authorization',
        'Content-Type',
        'Origin',
        'X-Requested-With',
        'X-CMS-Environment',
        'X-CSRF-TOKEN',
        'X-XSRF-TOKEN',
    ],

    'exposed_headers' => [
        'X-CMS-Environment',
    ],

    'max_age' => 600,

    'supports_credentials' => false,

];
