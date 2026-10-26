<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

class EnforcePlanApiLimits
{
    public function handle(Request $request, Closure $next): Response
    {
        $team = $request->attributes->get('team') ?? $request->user()?->currentTeam;

        if (! $team) {
            return $next($request);
        }

        $entitlements = $team->entitlements();
        $limits = $entitlements['limits'] ?? [];
        $hardCap = (bool) ($entitlements['meta']['hard_cap'] ?? false);

        if (($rps = $limits['api_rps'] ?? null) !== null) {
            $key = "plan-rps:{$team->id}";

            if (RateLimiter::tooManyAttempts($key, (int) $rps)) {
                return $this->error(429, "Rate limit of {$rps} requests/second reached for your plan.", ['Retry-After' => 1]);
            }

            RateLimiter::hit($key, 1);
        }

        $quota = $limits['api_requests'] ?? null;
        $counter = "plan-api:{$team->id}:".now()->format('Ym');

        Cache::add($counter, 0, now()->endOfMonth()->addDay());
        $used = (int) Cache::increment($counter);

        if ($quota !== null && $used > $quota && $hardCap) {
            return $this->error(429, "Monthly API quota ({$quota}) reached. Upgrade your plan to continue.", [
                'X-Plan-Quota-Limit' => $quota, 'X-Plan-Quota-Used' => $used,
            ]);
        }

        $response = $next($request);

        if ($quota !== null) {
            $response->headers->set('X-Plan-Quota-Limit', (string) $quota);
            $response->headers->set('X-Plan-Quota-Used', (string) $used);
            $response->headers->set('X-Plan-Quota-Remaining', (string) max(0, $quota - $used));
        }

        if ($entitlements['meta']['production'] ?? true) {
            return $response;
        }

        $response->headers->set('X-Stuvvion-Sandbox', 'true');

        return $response;
    }

    private function error(int $status, string $detail, array $headers = []): Response
    {
        return response()->json(
            ['errors' => [['status' => (string) $status, 'title' => 'Plan limit', 'detail' => $detail]]],
            $status,
            $headers,
        );
    }
}