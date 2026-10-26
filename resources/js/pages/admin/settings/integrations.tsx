import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useForm, usePage } from '@inertiajs/react';
import { updateIntegration } from '@/actions/App/Http/Controllers/Admin/SettingController';
import { toast } from 'sonner';
import { ExternalLink, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

interface IntegrationDef {
  provider: string;
  name: string;
  domain: string;
  category: string;
  color: string; // clase tailwind de fondo del icono
  fields: { key: string; label: string; type?: string }[];
}

const INTEGRATIONS: IntegrationDef[] = [
  { provider: 'stripe', name: 'Stripe', domain: 'stripe.com', category: 'Payments', color: 'bg-indigo-100 text-indigo-700', fields: [{ key: 'publishable_key', label: 'Publishable key' }, { key: 'secret_key', label: 'Secret key', type: 'password' }] },
  { provider: 'paypal', name: 'PayPal', domain: 'paypal.com', category: 'Payments', color: 'bg-blue-100 text-blue-700', fields: [{ key: 'client_id', label: 'Client ID' }, { key: 'client_secret', label: 'Client secret', type: 'password' }] },
  { provider: 'openai', name: 'OpenAI', domain: 'openai.com', category: 'AI', color: 'bg-emerald-100 text-emerald-700', fields: [{ key: 'api_key', label: 'API key', type: 'password' }] },
  { provider: 'anthropic', name: 'Anthropic', domain: 'anthropic.com', category: 'AI', color: 'bg-orange-100 text-orange-700', fields: [{ key: 'api_key', label: 'API key', type: 'password' }] },
  { provider: 'google_analytics', name: 'Google Analytics', domain: 'analytics.google.com', category: 'Analytics', color: 'bg-yellow-100 text-yellow-700', fields: [{ key: 'measurement_id', label: 'Measurement ID' }] },
  { provider: 'gtm', name: 'Google Tag Manager', domain: 'tagmanager.google.com', category: 'Analytics', color: 'bg-yellow-100 text-yellow-700', fields: [{ key: 'container_id', label: 'Container ID' }] },
  { provider: 'facebook_pixel', name: 'Facebook Pixel', domain: 'facebook.com', category: 'Analytics', color: 'bg-blue-100 text-blue-700', fields: [{ key: 'pixel_id', label: 'Pixel ID' }] },
  { provider: 'meta_capi', name: 'Meta Conversion API', domain: 'developers.facebook.com', category: 'Analytics', color: 'bg-blue-100 text-blue-700', fields: [{ key: 'access_token', label: 'Access token', type: 'password' }] },
  { provider: 'resend', name: 'Resend', domain: 'resend.com', category: 'Email', color: 'bg-slate-100 text-slate-700', fields: [{ key: 'api_key', label: 'API key', type: 'password' }] },
  { provider: 'posthog', name: 'PostHog', domain: 'posthog.com', category: 'Analytics', color: 'bg-black/10 text-black', fields: [{ key: 'project_api_key', label: 'Project API key' }] },
  { provider: 'slack', name: 'Slack', domain: 'slack.com', category: 'Notifications', color: 'bg-purple-100 text-purple-700', fields: [{ key: 'webhook_url', label: 'Incoming webhook URL' }] },
  { provider: 'discord', name: 'Discord', domain: 'discord.com', category: 'Notifications', color: 'bg-indigo-100 text-indigo-700', fields: [{ key: 'webhook_url', label: 'Webhook URL' }] },
];

export default function IntegrationsTab({ data }: { data: Record<string, unknown> }) {
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');

  const categories = useMemo(
    () => ['all', ...Array.from(new Set(INTEGRATIONS.map((i) => i.category)))],
    []
  );

  const filtered = useMemo(() => {
    return INTEGRATIONS.filter((i) => {
      const matchesCategory = category === 'all' || i.category === category;
      const matchesQuery = query.trim() === ''
        || i.name.toLowerCase().includes(query.toLowerCase())
        || i.category.toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold">Integrations and connected apps</h3>
          <p className="text-sm text-muted-foreground">Supercharge your workflow and connect the tools you use every day.</p>
        </div>
        <Button size="sm" variant="outline" className="shrink-0">
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Custom integration
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={category} onValueChange={setCategory}>
          <TabsList className="flex-wrap">
            {categories.map((cat) => (
              <TabsTrigger key={cat} value={cat} className="capitalize">
                {cat === 'all' ? 'All integrations' : cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((integration) => (
          <IntegrationCard
            key={integration.provider}
            integration={integration}
            enabled={Boolean(data[`${integration.provider}_enabled`])}
          />
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-muted-foreground">No integrations match your search.</p>
        )}
      </div>
    </div>
  );
}

function IntegrationCard({ integration, enabled }: { integration: IntegrationDef; enabled: boolean }) {
  const page = usePage();
  const { currentTeam } = page.props as { currentTeam?: any };
  const teamSlug = currentTeam!.slug;
  const [open, setOpen] = useState(false);
  const form = useForm({
    provider: integration.provider,
    enabled,
    credentials: Object.fromEntries(integration.fields.map((f) => [f.key, ''])),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    form.patch(updateIntegration(teamSlug).url, {
      preserveScroll: true,
      onSuccess: () => { setOpen(false); toast.success(`${integration.name} saved.`); },
    });
  }

  const initial = integration.name.charAt(0);

  return (
    <Card className="border-border/60">
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-semibold ${integration.color}`}>
            {initial}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium">{integration.name}</p>
          <a
            href={`https://${integration.domain}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:underline"
          >
            {integration.domain} <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <p className="text-sm text-muted-foreground">
          {enabled ? 'Connected and receiving data from your store.' : 'Not connected yet.'}
        </p>

        <div className="mt-1 flex items-center justify-between">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">View integration</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{integration.name}</DialogTitle></DialogHeader>
              <form onSubmit={submit} className="space-y-4">
                {integration.fields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label>{field.label}</Label>
                    <Input
                      type={field.type ?? 'text'}
                      value={form.data.credentials[field.key]}
                      onChange={(e) => form.setData('credentials', { ...form.data.credentials, [field.key]: e.target.value })}
                    />
                  </div>
                ))}
                <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                  <p className="text-sm font-medium">Enable integration</p>
                  <Switch checked={form.data.enabled} onCheckedChange={(v) => form.setData('enabled', v)} />
                </div>
                <DialogFooter><Button type="submit" disabled={form.processing}>Save</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Switch checked={enabled} disabled />
        </div>
      </CardContent>
    </Card>
  );
}