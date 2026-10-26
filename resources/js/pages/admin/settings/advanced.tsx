import { SettingsSection } from '@/components/settings/settings-section';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, router, usePage } from '@inertiajs/react';
import { updateAdvanced, runSystemAction } from '@/actions/App/Http/Controllers/Admin/SettingController';
import type { AdvancedSettings } from '@/types/settings';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';

const ACTIONS = [
  { key: 'clear-cache', label: 'Clear cache' },
  { key: 'optimize', label: 'Optimize' },
  { key: 'queue-restart', label: 'Restart queue' },
  { key: 'config-cache', label: 'Cache config' },
  { key: 'route-cache', label: 'Cache routes' },
  { key: 'view-cache', label: 'Cache views' },
];

export default function AdvancedTab({ data }: { data: AdvancedSettings }) {
  const page = usePage();
  const { currentTeam, standaloneModules = [] } = page.props as {
    currentTeam?: any;
    standaloneModules?: Array<{
      id: number; title: string; slug: string; label: string; icon: string;
    }>;
  };
  const teamSlug = currentTeam!.slug;

  const form = useForm({
    app_name: data.app_name ?? '',
    app_url: data.app_url ?? '',
    app_env: data.app_env ?? 'production',
    cache_driver: data.cache_driver ?? 'redis',
    queue_connection: data.queue_connection ?? 'redis',
    log_channel: data.log_channel ?? 'stack',
    debug: data.debug ?? false,
    maintenance_mode: data.maintenance_mode ?? false,
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    form.patch(updateAdvanced(teamSlug).url, { preserveScroll: true, onSuccess: () => toast.success('Advanced settings saved.') });
  }

  function runAction(action: string) {
    // Pasamos los argumentos dentro de un objeto único
    router.post(
      runSystemAction({ current_team: teamSlug, action: action }).url,
      {},
      {
        preserveScroll: true,
        onSuccess: () => toast.success(`${action} completed.`)
      }
    );
  }

  return (
    <div className="space-y-6">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Advanced settings</AlertTitle>
        <AlertDescription>These control core application behavior. Incorrect values can take the site offline.</AlertDescription>
      </Alert>

      <form onSubmit={submit}>
        <SettingsSection title="Application">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>APP_NAME</Label><Input value={form.data.app_name} onChange={(e) => form.setData('app_name', e.target.value)} /></div>
            <div className="space-y-2"><Label>APP_URL</Label><Input value={form.data.app_url} onChange={(e) => form.setData('app_url', e.target.value)} /></div>
            <div className="space-y-2">
              <Label>APP_ENV</Label>
              <Select value={form.data.app_env} onValueChange={(v) => form.setData('app_env', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">local</SelectItem>
                  <SelectItem value="staging">staging</SelectItem>
                  <SelectItem value="production">production</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>CACHE_DRIVER</Label>
              <Select value={form.data.cache_driver} onValueChange={(v) => form.setData('cache_driver', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="redis">redis</SelectItem>
                  <SelectItem value="file">file</SelectItem>
                  <SelectItem value="database">database</SelectItem>
                  <SelectItem value="memcached">memcached</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>QUEUE_CONNECTION</Label>
              <Select value={form.data.queue_connection} onValueChange={(v) => form.setData('queue_connection', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="redis">redis</SelectItem>
                  <SelectItem value="database">database</SelectItem>
                  <SelectItem value="sync">sync</SelectItem>
                  <SelectItem value="sqs">sqs</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>LOG_CHANNEL</Label><Input value={form.data.log_channel} onChange={(e) => form.setData('log_channel', e.target.value)} /></div>
          </div>
          <div className="grid gap-3 pt-2 sm:grid-cols-2">
            <ToggleRow label="Debug mode" checked={form.data.debug} onChange={(v) => form.setData('debug', v)} />
            <ToggleRow label="Maintenance mode" checked={form.data.maintenance_mode} onChange={(v) => form.setData('maintenance_mode', v)} />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={form.processing}>Save changes</Button>
          </div>
        </SettingsSection>
      </form>

      <SettingsSection title="System actions">
        <div className="flex flex-wrap gap-2">
          {ACTIONS.map((action) => (
            <Button key={action.key} type="button" variant="outline" size="sm" onClick={() => runAction(action.key)}>
              {action.label}
            </Button>
          ))}
        </div>
      </SettingsSection>
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
      <p className="text-sm font-medium">{label}</p>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}