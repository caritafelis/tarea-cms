<?php

namespace App\Services\Settings;

use Illuminate\Support\Facades\Route;

class ApiIntrospectionService
{
    /** Lists every registered REST route under /api automatically — no manual maintenance. */
    public function restEndpoints(): array
    {
        return collect(Route::getRoutes())
            ->filter(fn ($route) => str_starts_with($route->uri(), 'api/'))
            ->map(fn ($route) => [
                'methods' => array_values(array_diff($route->methods(), ['HEAD'])),
                'uri' => '/'.$route->uri(),
                'name' => $route->getName(),
                'middleware' => array_values($route->gatherMiddleware()),
            ])
            ->sortBy('uri')
            ->values()
            ->toArray();
    }

    public function summary(): array
    {
        return [
            'base_url' => rtrim(config('app.url'), '/').'/api',
            'version' => config('cms.api_version', 'v1'),
            'rate_limit' => config('cms.api_rate_limit', '60/min'),
            'openapi_url' => rtrim(config('app.url'), '/').'/api/openapi.json',
            'test_keys_can_write' => (bool) config('settings.test_keys_can_write', false),
            'graphql' => [
                'endpoint' => rtrim(config('app.url'), '/').'/graphql',
                'playground' => rtrim(config('app.url'), '/').'/graphiql',
                'enabled' => Route::has('graphql') || config('lighthouse.route') !== false,
            ],
        ];
    }
}
