import { SettingsSection } from '@/components/settings/settings-section';
import { EnvironmentSwitch } from '@/components/settings/environment-switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useForm, router, usePage } from '@inertiajs/react';
import {
  storeWebhook, updateWebhook, destroyWebhook, testWebhook,
} from '@/actions/App/Http/Controllers/Admin/SettingController';
import { useApiEnvironment } from '@/hooks/use-api-environment';
import { toast } from 'sonner';
import { MoreVertical, PlayCircle, Trash2, Webhook as WebhookIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Webhook, WebhooksSettings } from '@/types/settings';

export default function WebhooksTab({ data }: { data: WebhooksSettings }) {
  const page = usePage();
  const { currentTeam } = page.props as { currentTeam?: { slug: string } };
  const teamSlug = currentTeam!.slug;

  const [env] = useApiEnvironment();
  const [open, setOpen] = useState(false);
  const [hookToDelete, setHookToDelete] = useState<Webhook | null>(null);
  const form = useForm({ name: '', url: '', events: [] as string[], is_active: true });

  const items = useMemo(() => data.items.filter((h) => (h.environment ?? 'live') === env), [data.items, env]);
  const counts = useMemo(
    () => ({
      live: data.items.filter((h) => (h.environment ?? 'live') === 'live').length,
      test: data.items.filter((h) => h.environment === 'test').length,
    }),
    [data.items],
  );

  const envLabel = env === 'test' ? 'test' : 'production';

  function submit(e: React.FormEvent) {
    e.preventDefault();
    form.transform((d) => ({ ...d, environment: env }));
    form.post(storeWebhook(teamSlug).url, {
      preserveScroll: true,
      onSuccess: () => {
        setOpen(false);
        form.reset();
        toast.success('Webhook created.');
      },
    });
  }

  // The update endpoint validates the full payload, so the toggle sends all fields.
  function toggleActive(hook: Webhook, checked: boolean) {
    const route = updateWebhook([teamSlug, hook.id]);
    router.visit(route.url, {
      method: route.method,
      data: {
        name: hook.name,
        url: hook.url,
        events: hook.events,
        environment: hook.environment ?? 'live',
        is_active: checked,
      },
      preserveScroll: true,
      preserveState: true,
    });
  }

  function confirmDelete() {
    if (!hookToDelete) return;
    router.delete(destroyWebhook([teamSlug, hookToDelete.id]).url, {
      preserveScroll: true,
      onSuccess: () => setHookToDelete(null),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Webhooks</h2>
          <p className="text-sm text-muted-foreground">
            Changes made in the admin panel notify both environments. Changes made with an API key notify only its own.
          </p>
        </div>
        <EnvironmentSwitch value={env} counts={counts} />
      </div>

      <SettingsSection
        title={env === 'test' ? 'Test webhooks' : 'Production webhooks'}
        description={
          env === 'test'
            ? 'Rebuild staging and preview sites when content changes.'
            : 'Rebuild live sites and notify external systems when content changes.'
        }
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm">New {envLabel} webhook</Button></DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create {envLabel} webhook</DialogTitle>
                <DialogDescription>We’ll send a signed POST request to this URL for each selected event.</DialogDescription>
              </DialogHeader>
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="hook-name">Name</Label>
                  <Input id="hook-name" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} autoFocus />
                  {form.errors.name && <p className="text-xs text-destructive">{form.errors.name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hook-url">URL</Label>
                  <Input
                    id="hook-url"
                    value={form.data.url}
                    onChange={(e) => form.setData('url', e.target.value)}
                    placeholder={env === 'test' ? 'https://staging.example.com/hooks/cms' : 'https://example.com/hooks/cms'}
                  />
                  {form.errors.url && <p className="text-xs text-destructive">{form.errors.url}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Events</Label>
                  <div className="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto rounded-lg border p-3">
                    {data.events.map((event) => (
                      <label key={event} className="flex items-center gap-2 font-mono text-xs">
                        <Checkbox
                          checked={form.data.events.includes(event)}
                          onCheckedChange={(checked) =>
                            form.setData('events', checked ? [...form.data.events, event] : form.data.events.filter((e) => e !== event))
                          }
                        />
                        {event}
                      </label>
                    ))}
                  </div>
                  {form.errors.events && <p className="text-xs text-destructive">{form.errors.events}</p>}
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={form.processing || !form.data.name || !form.data.url || form.data.events.length === 0}>
                    Create webhook
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      >
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-10 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <WebhookIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No {envLabel} webhooks yet</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              Add one to get notified when posts, pages or products change.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="min-w-[140px]">Name</TableHead>
                  <TableHead className="min-w-[220px]">URL</TableHead>
                  <TableHead className="min-w-[200px]">Events</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Deliveries</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((hook) => (
                  <TableRow key={hook.id}>
                    <TableCell className="font-medium">{hook.name}</TableCell>
                    <TableCell className="max-w-[280px]">
                      <span className="block truncate font-mono text-xs text-muted-foreground" title={hook.url}>{hook.url}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {hook.events.slice(0, 3).map((e) => (
                          <Badge key={e} variant="secondary" className="font-mono text-[11px] font-normal">{e}</Badge>
                        ))}
                        {hook.events.length > 3 && <Badge variant="outline">+{hook.events.length - 3}</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={hook.is_active}
                        onCheckedChange={(c) => toggleActive(hook, c)}
                        aria-label={`${hook.is_active ? 'Disable' : 'Enable'} ${hook.name}`}
                      />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{hook.logs_count}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8" aria-label={`Actions for ${hook.name}`}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.post(testWebhook([teamSlug, hook.id]).url, {}, { preserveScroll: true })}>
                            <PlayCircle className="mr-2 h-3.5 w-3.5" /> Send test
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setHookToDelete(hook)}>
                            <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SettingsSection>

      <Dialog open={!!hookToDelete} onOpenChange={(v) => !v && setHookToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete “{hookToDelete?.name}”?</DialogTitle>
            <DialogDescription>It will stop receiving events and its delivery history will be removed.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHookToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete webhook</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
