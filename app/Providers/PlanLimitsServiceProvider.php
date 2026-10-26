<?php

namespace App\Providers;

use App\Models\ApiKey;
use App\Models\Cpt;
use App\Models\CptEntry;
use App\Models\Page;
use App\Models\Post;
use App\Models\Product;
use App\Models\Webhook;
use App\Support\Entitlements;
use Illuminate\Support\ServiceProvider;

class PlanLimitsServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $guard = fn (string $limit, callable $count, string $label) => function () use ($limit, $count, $label): void {
            $team = auth()->user()?->currentTeam;

            if ($team) {
                Entitlements::assertWithinLimit($team, $limit, (int) $count($team), $label);
            }
        };

        $entries = $guard('entries', fn ($t) => Entitlements::entryCount($t), 'Content entries');

        Page::creating($entries);
        Post::creating($entries);
        CptEntry::creating($entries);

        Cpt::creating($guard('content_types', fn ($t) => Cpt::where('team_id', $t->id)->count(), 'Content types'));
        Webhook::creating($guard('webhooks', fn () => Webhook::count(), 'Webhooks'));
        ApiKey::creating($guard('api_keys', fn ($t) => ApiKey::where('team_id', $t->id)->count(), 'API keys'));
        Product::creating($guard('products', fn () => Product::count(), 'Products'));
    }
}