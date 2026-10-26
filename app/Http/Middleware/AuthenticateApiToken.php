<?php

namespace App\Http\Middleware;

use App\Models\ApiKey;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateApiToken
{
    private const READ_METHODS = ['GET', 'HEAD', 'OPTIONS'];

    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if (! $token) {
            return $this->error(401, 'Unauthorized', 'A Bearer token is required.');
        }

        if (str_starts_with($token, 'cms_')) {
            return $this->viaApiKey($request, $next, $token);
        }

        $user = Auth::guard('sanctum')->user();

        if (! $user) {
            return $this->error(401, 'Unauthorized', 'Invalid or expired token.');
        }

        Auth::shouldUse('sanctum');
        $request->setUserResolver(fn () => $user);
        $request->attributes->set('api_environment', 'live');

        return $next($request);
    }

    private function viaApiKey(Request $request, Closure $next, string $token): Response
    {
        $key = ApiKey::findByPlainText($token);

        if (! $key || ($key->expires_at && $key->expires_at->isPast())) {
            return $this->error(401, 'Unauthorized', 'Invalid or expired API key.');
        }

        $user = User::find($key->user_id);

        if (! $user) {
            return $this->error(401, 'Unauthorized', 'The owner of this API key no longer exists.');
        }

        $needed = in_array($request->method(), self::READ_METHODS, true) ? 'read' : 'write';
        $environment = $key->environment ?? 'live';

        // Defense in depth: even if a test key somehow has write abilities, block it.
        if ($environment === 'test' && $needed === 'write' && ! config('settings.test_keys_can_write', false)) {
            return $this->error(403, 'Forbidden', 'Test keys are read-only. Use a live key to modify content.');
        }

        if (! $this->allows($key->abilities ?? [], $needed, $request)) {
            return $this->error(403, 'Forbidden', "This API key lacks the '{$needed}' ability.");
        }

        $key->forceFill(['last_used_at' => now()])->saveQuietly();

        Auth::setUser($user);
        $request->setUserResolver(fn () => $user);
        $request->attributes->set('api_environment', $environment);

        $response = $next($request);
        $response->headers->set('X-CMS-Environment', $environment);

        return $response;
    }

    /**
     * Accepts "*", the generic "read"/"write", or the per-resource form the Settings UI
     * actually creates ("posts:read"). The resource comes from the URL: /api/[v1/]{resource}/…
     */
    private function allows(array $abilities, string $needed, Request $request): bool
    {
        if (in_array('*', $abilities, true) || in_array($needed, $abilities, true)) {
            return true;
        }

        $resource = $this->resourceFor($request);

        return $resource !== null && in_array("{$resource}:{$needed}", $abilities, true);
    }

    private function resourceFor(Request $request): ?string
    {
        $segments = array_values(array_filter(explode('/', $request->path())));
        array_shift($segments); // "api"

        if (isset($segments[0]) && preg_match('/^v\d+$/', $segments[0])) {
            array_shift($segments);
        }

        return $segments[0] ?? null;
    }

    private function error(int $status, string $title, string $detail): Response
    {
        return response()->json(
            ['errors' => [['status' => (string) $status, 'title' => $title, 'detail' => $detail]]],
            $status,
            ['Content-Type' => 'application/vnd.api+json'],
        );
    }
}