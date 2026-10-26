<?php

namespace App\Http\Controllers;

use App\Models\CptEntry;
use App\Models\Media;
use App\Models\Page;
use App\Models\Post;
use App\Models\WebhookLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    private const PERIODS = ['1h' => 60, '24h' => 1440, '7d' => 10080, '14d' => 20160, '30d' => 43200];

    public function __invoke(Request $request, string $current_team): Response
    {
        $team = $request->user()->currentTeam;
        $period = array_key_exists($request->query('period', ''), self::PERIODS) ? $request->query('period') : '24h';
        $minutes = self::PERIODS[$period];
        $from = now()->subMinutes($minutes);
        $hourly = $minutes <= 1440;
        $limits = $team->entitlements()['limits'] ?? [];

        $logs = WebhookLog::where('created_at', '>=', $from)->get(['created_at', 'successful']);

        return Inertia::render('dashboard', [
            'period' => $period,
            'from' => $from->toIso8601String(),
            'to' => now()->toIso8601String(),
            'plan' => $team->activeSubscription()?->plan?->name ?? 'Free',
            'api' => [
                'used' => (int) Cache::get('plan-api:'.$team->id.':'.now()->format('Ym'), 0),
                'limit' => $limits['api_requests'] ?? null,
            ],
            'storage' => ['used' => (int) Media::sum('size'), 'limit_gb' => $limits['storage_gb'] ?? null],
            'content' => [
                'pages' => ['total' => Page::count(), 'changed' => Page::where('updated_at', '>=', $from)->count()],
                'posts' => ['total' => Post::count(), 'changed' => Post::where('updated_at', '>=', $from)->count()],
                'entries' => ['total' => CptEntry::count(), 'changed' => CptEntry::where('updated_at', '>=', $from)->count()],
            ],
            'webhooks' => [
                'total' => $logs->count(),
                'ok' => $logs->where('successful', true)->count(),
                'failed' => $logs->where('successful', false)->count(),
                'series' => $logs->groupBy(fn ($l) => $l->created_at->format($hourly ? 'Y-m-d H:00' : 'Y-m-d'))
                    ->map(fn ($g, $t) => ['t' => $t, 'ok' => $g->where('successful', true)->count(), 'failed' => $g->where('successful', false)->count()])
                    ->values(),
                'recent_failures' => WebhookLog::where('successful', false)->latest()->limit(5)
                    ->get(['id', 'event', 'response_code', 'created_at']),
            ],
        ]);
    }
}