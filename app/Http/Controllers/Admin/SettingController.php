<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\AdvancedSettingsRequest;
use App\Http\Requests\Settings\ApiKeyStoreRequest;
use App\Http\Requests\Settings\BackupSettingsRequest;
use App\Http\Requests\Settings\EmailSettingsRequest;
use App\Http\Requests\Settings\GeneralSettingsRequest;
use App\Http\Requests\Settings\IntegrationSettingsRequest;
use App\Http\Requests\Settings\LocalizationSettingsRequest;
use App\Http\Requests\Settings\SecuritySettingsRequest;
use App\Http\Requests\Settings\SeoSettingsRequest;
use App\Http\Requests\Settings\StorageSettingsRequest;
use App\Http\Requests\Settings\WebhookStoreRequest;
use App\Models\ApiKey;
use App\Models\Backup;
use App\Models\Plugin;
use App\Models\Setting;
use App\Models\Team;
use App\Models\Webhook;
use App\Services\Billing\BillingService;
use App\Services\Settings\ApiIntrospectionService;
use App\Services\Settings\ApiKeyService;
use App\Services\Settings\BackupService;
use App\Services\Settings\MailProviderRegistry;
use App\Services\Settings\MailTestService;
use App\Services\Settings\PluginService;
use App\Services\Settings\SeoService;
use App\Services\Settings\SessionService;
use App\Services\Settings\SystemService;
use App\Services\Settings\WebhookService;
use App\Support\WebhookDocs;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use App\Http\Requests\Settings\ApiKeyUpdateRequest;
use App\Support\ApiAbilities;

class SettingController extends Controller
{
    public function __construct(
        private readonly SeoService $seo,
        private readonly ApiIntrospectionService $apiIntrospection,
        private readonly ApiKeyService $apiKeys,
        private readonly WebhookService $webhooks,
        private readonly BackupService $backups,
        private readonly SystemService $system,
        private readonly MailTestService $mailTest,
        private readonly PluginService $plugins,
        private readonly MailProviderRegistry $mailProviders,
        private readonly SessionService $sessions,
        private readonly BillingService $billing,
    ) {}

    /** Renders the single Settings page. All tab data ships in one payload. */
    public function index(Request $request): Response
    {
        return Inertia::render('admin/settings/index', [
            'general' => Setting::group('site'),
            'localization' => Setting::group('localization'),
            'seo' => [
                'meta' => Setting::group('seo'),
                'files' => $this->seo->publicFiles(),
            ],
            'api' => [
                'summary' => $this->apiIntrospection->summary(),
                'endpoints' => $this->apiIntrospection->restEndpoints(),
                'keys' => ApiKey::where('team_id', $this->currentTeam($request)->id)->latest()->get(),
                'permissions' => ApiAbilities::catalog(),
                'plain_text_key' => session('plain_text_key'),
            ],
            'email' => array_merge(Setting::group('email'), [
                'providers' => $this->mailProviders->all(),
            ]),
            'storage' => [
                'settings' => Setting::group('storage'),
                'usage' => $this->system->storageUsage(),
            ],
            'webhooks' => [
                'items' => Webhook::withCount('logs')->latest()->get(),
                'events' => Webhook::EVENTS,
                'docs' => WebhookDocs::catalog(),
            ],
            'integrations' => Setting::group('integrations'),
            'plugins' => $this->plugins->getPlugins(),
            'security' => array_merge(Setting::group('security'), [
                'sessions' => $this->sessions->forUser(),
            ]),
            'backups' => [
                'settings' => Setting::group('backups'),
                'items' => Backup::latest()->get(),
            ],
            'advanced' => Setting::group('advanced'),
            'billing' => $this->billing->forUser($request->user()),
        ]);
    }

    // ---------------------------------------------------------------
    // Simple key/value tabs — each PATCHes only its own group.
    // ---------------------------------------------------------------

    public function updateGeneral(GeneralSettingsRequest $request): RedirectResponse
    {
        $data = $request->safe()->except(['logo', 'favicon']);

        if ($request->hasFile('logo')) {
            $data['logo'] = $request->file('logo')->store('branding', 'public');
        }
        if ($request->hasFile('favicon')) {
            $data['favicon'] = $request->file('favicon')->store('branding', 'public');
        }

        Setting::setMany($data, 'site');

        return back()->with('success', 'General settings updated.');
    }

    public function updateLocalization(LocalizationSettingsRequest $request): RedirectResponse
    {
        Setting::setMany($request->validated(), 'localization');

        return back()->with('success', 'Localization settings updated.');
    }

    public function updateSeo(SeoSettingsRequest $request): RedirectResponse
    {
        $data = $request->safe()->except('og_image');

        if ($request->hasFile('og_image')) {
            $data['og_image'] = $request->file('og_image')->store('seo', 'public');
        }

        Setting::setMany($data, 'seo');

        return back()->with('success', 'SEO settings updated.');
    }

    public function generateSeoFile(Request $request, string $type): RedirectResponse
    {
        $this->seo->generate($type);

        return back()->with('success', ucfirst($type).' regenerated.');
    }

    /**
     * Email ahora es multi-proveedor: "mailer" dice cuál está activo,
     * y "credentials" solo trae los campos que ese proveedor necesita
     * (ver MailProviderRegistry + EmailSettingsRequest).
     */
    public function updateEmail(EmailSettingsRequest $request): RedirectResponse
    {
        Setting::setMany($request->validated(), 'email');

        return back()->with('success', 'Email settings updated.');
    }

    public function sendTestEmail(Request $request): RedirectResponse
    {
        $request->validate(['email' => 'required|email']);
        $result = $this->mailTest->send($request->string('email'));

        return back()->with($result['success'] ? 'success' : 'error', $result['message']);
    }

    public function updateStorage(StorageSettingsRequest $request): RedirectResponse
    {
        Setting::setMany($request->validated(), 'storage');

        return back()->with('success', 'Storage settings updated.');
    }

    public function updateSecurity(SecuritySettingsRequest $request): RedirectResponse
    {
        Setting::setMany($request->validated(), 'security');

        return back()->with('success', 'Security settings updated.');
    }

    /** Revoca una sesión activa (tab Security -> "Browsers and devices"). */
    public function destroySession(Request $request, string $sessionId): RedirectResponse
    {
        $this->sessions->revoke($sessionId);

        return back()->with('success', 'Session revoked.');
    }

    public function updateAdvanced(AdvancedSettingsRequest $request): RedirectResponse
    {
        Setting::setMany($request->validated(), 'advanced');

        return back()->with('success', 'Advanced settings updated.');
    }

    public function updateIntegration(IntegrationSettingsRequest $request): RedirectResponse
    {
        $data = $request->validated();
        Setting::setMany([
            "{$data['provider']}_enabled" => $data['enabled'] ?? false,
            "{$data['provider']}_credentials" => $data['credentials'],
        ], 'integrations');

        return back()->with('success', ucfirst($data['provider']).' integration saved.');
    }

    // ---------------------------------------------------------------
    // API Keys (independent resource — NOT stored in `settings`)
    // ---------------------------------------------------------------

    public function storeApiKey(ApiKeyStoreRequest $request): RedirectResponse
    {
        $result = $this->apiKeys->create(
            (string) $request->input('name'),
            $request->input('abilities'),
            $request->input('expires_at'),
            $request->input('environment'),
            $this->currentTeam($request),
        );

        return back()->with('success', 'API key created.')->with('plain_text_key', $result['plain_text_key']);
    }

    public function updateApiKey(ApiKeyUpdateRequest $request, string $currentTeam, ApiKey $apiKey): RedirectResponse
    {
        abort_unless($apiKey->team_id === null || $apiKey->team_id === $this->currentTeam($request)->id, 404);

        $this->apiKeys->updateAbilities($apiKey, $request->input('abilities'));

        return back()->with('success', 'API key permissions updated.');
    }

    public function regenerateApiKey(Request $request, string $currentTeam, ApiKey $apiKey): RedirectResponse
    {
        $team = $this->currentTeam($request);
        abort_unless($apiKey->team_id === null || $apiKey->team_id === $team->id, 404);

        $result = $this->apiKeys->regenerate($apiKey, $team);

        return back()->with('success', 'API key regenerated.')->with('plain_text_key', $result['plain_text_key']);
    }

    public function destroyApiKey(Request $request, string $currentTeam, ApiKey $apiKey): RedirectResponse
    {
        abort_unless($apiKey->team_id === null || $apiKey->team_id === $this->currentTeam($request)->id, 404);

        $this->apiKeys->revoke($apiKey);

        return back()->with('success', 'API key revoked.');
    }

    // ---------------------------------------------------------------
    // Webhooks
    // ---------------------------------------------------------------

    public function storeWebhook(WebhookStoreRequest $request): RedirectResponse
    {
        Webhook::create($request->validated() + ['secret' => Str::random(32)]);

        return back()->with('success', 'Webhook created.');
    }

    public function updateWebhook(WebhookStoreRequest $request, string $currentTeam, Webhook $webhook): RedirectResponse
    {
        $webhook->update($request->validated());

        return back()->with('success', 'Webhook updated.');
    }

    public function destroyWebhook(string $currentTeam, Webhook $webhook): RedirectResponse
    {
        $webhook->delete();

        return back()->with('success', 'Webhook deleted.');
    }

    public function testWebhook(string $currentTeam, Webhook $webhook): RedirectResponse
    {
        $log = $this->webhooks->test($webhook);

        return back()->with($log->successful ? 'success' : 'error', $log->successful
            ? 'Test event delivered successfully.'
            : 'Test event failed — check the logs.');
    }

    // ---------------------------------------------------------------
    // Plugins
    // ---------------------------------------------------------------

    public function togglePlugin(Request $request, Plugin $plugin): RedirectResponse
    {
        $request->validate(['is_active' => 'required|boolean']);
        $this->plugins->toggle($plugin, $request->boolean('is_active'));

        return back()->with('success', $plugin->name.($request->boolean('is_active') ? ' activated.' : ' deactivated.'));
    }

    // ---------------------------------------------------------------
    // Backups
    // ---------------------------------------------------------------

    public function updateBackupSettings(BackupSettingsRequest $request): RedirectResponse
    {
        Setting::setMany($request->validated(), 'backups');

        return back()->with('success', 'Backup settings updated.');
    }

    public function runBackup(): RedirectResponse
    {
        $this->backups->runNow();

        return back()->with('success', 'Backup started.');
    }

    public function destroyBackup(Backup $backup): RedirectResponse
    {
        $this->backups->delete($backup);

        return back()->with('success', 'Backup deleted.');
    }

    public function downloadBackup(Backup $backup): StreamedResponse
    {
        $disk = Storage::disk($backup->disk);

        abort_unless($disk->exists($backup->path), 404, 'Backup file not found.');

        return response()->streamDownload(function () use ($disk, $backup) {
            $stream = $disk->readStream($backup->path);
            fpassthru($stream);
            fclose($stream);
        }, basename($backup->path), [
            'Content-Type' => 'application/zip',
        ]);
    }

    // ---------------------------------------------------------------
    // System actions (Advanced tab buttons)
    // ---------------------------------------------------------------

    public function runSystemAction(Request $request, string $action): RedirectResponse
    {
        $output = $this->system->run($action);

        return back()->with('success', "Action '{$action}' completed.")->with('system_output', $output);
    }

    private function currentTeam(Request $request): Team
    {
        $param = $request->route('current_team');
        $team = $param instanceof Team ? $param : Team::where('slug', $param)->firstOrFail();

        abort_unless($request->user()->belongsToTeam($team), 403);

        return $team;
    }
}
