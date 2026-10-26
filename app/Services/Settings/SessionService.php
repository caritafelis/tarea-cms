<?php

namespace App\Services\Settings;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/**
 * Lee la tabla "sessions" (driver de sesión = database, que ya usa
 * la app) para mostrar "Browsers and devices" en el tab de Security,
 * igual que hacen productos como Untitled UI / GitHub / Laravel Jetstream.
 */
class SessionService
{
    public function forUser(): array
    {
        if (! Auth::check()) {
            return [];
        }

        $currentId = session()->getId();

        return DB::table('sessions')
            ->where('user_id', Auth::id())
            ->orderByDesc('last_activity')
            ->get()
            ->map(function ($row) use ($currentId) {
                $agent = $this->parseAgent($row->user_agent);

                return [
                    'id' => $row->id,
                    'ip_address' => $row->ip_address,
                    'is_current_device' => $row->id === $currentId,
                    'last_active' => Carbon::createFromTimestamp($row->last_activity)->diffForHumans(),
                    'browser' => $agent['browser'],
                    'platform' => $agent['platform'],
                ];
            })
            ->values()
            ->all();
    }

    public function revoke(string $sessionId): void
    {
        DB::table('sessions')
            ->where('id', $sessionId)
            ->where('user_id', Auth::id())
            ->delete();
    }

    /**
     * Detección simple sin dependencias externas (jenssegers/agent, etc.).
     * Si ya tienes ese paquete instalado, reemplaza esto por su parser.
     */
    protected function parseAgent(?string $userAgent): array
    {
        $ua = $userAgent ?? '';

        $platform = match (true) {
            str_contains($ua, 'iPhone') => 'iPhone',
            str_contains($ua, 'iPad') => 'iPad',
            str_contains($ua, 'Android') => 'Android',
            str_contains($ua, 'Mac OS X') || str_contains($ua, 'Macintosh') => 'Mac OS X',
            str_contains($ua, 'Windows') => 'Windows',
            str_contains($ua, 'Linux') => 'Linux',
            default => 'Unknown device',
        };

        $browser = match (true) {
            str_contains($ua, 'Brave') => 'Brave',
            str_contains($ua, 'Edg/') => 'Edge',
            str_contains($ua, 'OPR/') => 'Opera',
            str_contains($ua, 'Chrome/') => 'Chrome',
            str_contains($ua, 'Firefox/') => 'Firefox',
            str_contains($ua, 'Safari/') => 'Safari',
            default => 'Browser',
        };

        return ['browser' => $browser, 'platform' => $platform];
    }
}
