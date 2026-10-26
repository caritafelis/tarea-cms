<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\PluginService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PluginController extends Controller
{
    protected $pluginService;

    public function __construct(PluginService $pluginService)
    {
        $this->pluginService = $pluginService;
    }

    public function index(string $current_team)
    {
        $plugins = $this->pluginService->getPlugins();

        return Inertia::render('admin/plugins/index', [
            'plugins' => $plugins,
        ]);
    }

    public function toggle(Request $request, string $current_team, $slug)
    {
        $request->validate([
            'is_active' => 'required|boolean',
        ]);

        if ($request->is_active) {
            $this->pluginService->activatePlugin($slug);
            $msg = "Plugin '{$slug}' activated.";
        } else {
            $this->pluginService->deactivatePlugin($slug);
            $msg = "Plugin '{$slug}' deactivated.";
        }

        return redirect()->route('admin.plugins.index', ['current_team' => $current_team])->with('success', $msg);
    }
}
