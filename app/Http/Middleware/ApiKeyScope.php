<?php

namespace App\Http\Middleware;

use App\Models\ApiKey;
use App\Support\ApiAbilities;
use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

class ApiKeyScope
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();
        $key = null;

        if ($token && str_starts_with($token, 'cms_')) {
            $key = ApiKey::findByPlainText($token);

            if (! $key || ($key->expires_at && $key->expires_at->isPast())) {
                return $this->error(401, 'Unauthorized', 'Invalid or expired API key.');
            }

            $abilities = $key->abilities ?? [];
            $environment = $key->environment ?? 'live';
        } else {
            $pat = $request->user()?->currentAccessToken();
            $abilities = $pat instanceof PersonalAccessToken ? ($pat->abilities ?? ['*']) : ['*'];
            $environment = 'live';
        }

        $req = ApiAbilities::requirements($request);

        if ($environment === 'test' && $req['writes'] && ! config('settings.test_keys_can_write', false)) {
            return $this->error(403, 'Forbidden', 'Test keys are read-only. Use a production key to modify content.');
        }

        if (! in_array('*', $abilities, true)) {
            if (! $req['mappable']) {
                return $this->error(403, 'Forbidden', 'This API key cannot access this endpoint.');
            }

            foreach ($req['needs'] as [$resource, $action]) {
                if (! ApiAbilities::grants($abilities, $resource, $action)) {
                    return $this->error(403, 'Forbidden', "This API key has no '{$action}' permission on '{$resource}'.");
                }
            }
        }

        if ($key && (! $key->last_used_at || $key->last_used_at->lt(now()->subMinutes(5)))) {
            $key->forceFill(['last_used_at' => now()])->saveQuietly();
        }

        $request->attributes->set('api_environment', $environment);
        $request->attributes->set('api_key_scoped', ApiAbilities::scopedToPublished($abilities));

        $response = $next($request);

        if ($key) {
            $response->headers->set('X-CMS-Environment', $environment);
        }

        return $response;
    }

    private function error(int $status, string $title, string $detail): Response
    {
        return response()->json(
            [
                'jsonapi' => ['version' => '1.0'],
                'errors' => [['status' => (string) $status, 'title' => $title, 'detail' => $detail]],
            ],
            $status,
            ['Content-Type' => 'application/vnd.api+json'],
        );
    }
}