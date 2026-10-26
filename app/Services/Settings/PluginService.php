<?php

namespace App\Services\Settings;

use App\Models\Plugin;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class PluginService
{
    public function getPlugins(): Collection
    {
        $pluginsDir = app_path('Plugins');
        File::ensureDirectoryExists($pluginsDir);

        collect(File::directories($pluginsDir))
            ->map(fn ($dir) => basename($dir))
            ->each(fn ($slug) => Plugin::firstOrCreate(
                ['slug' => $slug],
                ['name' => Str::headline($slug), 'is_active' => false]
            ));

        return Plugin::orderBy('name')->get();
    }

    public function toggle(Plugin $plugin, bool $active): void
    {
        $plugin->update(['is_active' => $active]);

        $providerClass = 'App\\Plugins\\'.Str::studly($plugin->slug).'\\ServiceProvider';

        // Providers self-register only when the plugin is active; actual (de)registration
        // happens on next request via AppServiceProvider::register() reading Plugin::isActive().
        if ($active && ! class_exists($providerClass)) {
            report(new \RuntimeException("Plugin [{$plugin->slug}] has no ServiceProvider."));
        }
    }
}
