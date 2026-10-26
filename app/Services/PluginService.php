<?php

namespace App\Services;

use App\Models\Plugin;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\File;

class PluginService
{
    /**
     * Get all plugins in database/filesystem.
     */
    public function getPlugins(): Collection
    {
        $pluginsDir = app_path('Plugins');
        if (!File::isDirectory($pluginsDir)) {
            File::makeDirectory($pluginsDir, 0755, true, true);
        }

        $directories = File::directories($pluginsDir);
        $availableSlugs = collect($directories)->map(function ($dir) {
            return basename($dir);
        });

        foreach ($availableSlugs as $slug) {
            Plugin::firstOrCreate(
                ['slug' => $slug],
                ['name' => ucfirst($slug), 'is_active' => false]
            );
        }

        return Plugin::all();
    }

    /**
     * Activate a plugin.
     */
    public function activatePlugin(string $slug): void
    {
        $plugin = Plugin::where('slug', $slug)->first();
        if ($plugin) {
            $plugin->update(['is_active' => true]);
        }
    }

    /**
     * Deactivate a plugin.
     */
    public function deactivatePlugin(string $slug): void
    {
        $plugin = Plugin::where('slug', $slug)->first();
        if ($plugin) {
            $plugin->update(['is_active' => false]);
        }
    }

    /**
     * Boot all active plugins dynamically.
     */
    public function bootPlugins(): void
    {
        $activePlugins = Plugin::where('is_active', true)->get();

        foreach ($activePlugins as $plugin) {
            $serviceProviderClass = "App\\Plugins\\" . ucfirst($plugin->slug) . "\\ServiceProvider";
            if (class_exists($serviceProviderClass)) {
                app()->register($serviceProviderClass);
            }
        }
    }
}
