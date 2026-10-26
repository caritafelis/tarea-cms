import { SettingsSection } from '@/components/settings/settings-section';
import { EnvironmentSwitch, SandboxNotice } from '@/components/settings/environment-switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm, router, usePage } from '@inertiajs/react';
import {
  storeApiKey, regenerateApiKey, destroyApiKey, updateApiKey,
} from '@/actions/App/Http/Controllers/Admin/SettingController';
import { toast } from 'sonner';
import {
  AlertTriangle, Check, ChevronDown, Copy, ExternalLink, KeyRound, MoreVertical, Pencil, RotateCw, Search, Trash2, X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { ApiPermissionGroup, ApiPermissionResource, ApiPermissions, ApiSettings } from '@/types/settings';
import { useApiEnvironment } from '@/hooks/use-api-environment';

type Action = 'read' | 'create' | 'update' | 'delete';
const ACTIONS: Action[] = ['read', 'create', 'update', 'delete'];
const DRAFTS = 'drafts:read';

const isWrite = (a: string) => a === '*' || a === 'write' || /:(write|create|update|delete|\*)$/.test(a);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));

/** Expands wildcards (`*:read`, `posts:*`, `*`) into explicit `resource:action` pairs. Wildcards never cover sensitive models. */
function toExplicit(value: string[], resources: ApiPermissionResource[]): Set<string> {
  const set = new Set<string>();
  if (value.includes('*')) {
    resources.forEach((r) => r.actions.forEach((a) => set.add(`${r.key}:${a}`)));
    return set;
  }
  for (const ability of value) {
    if (ability === DRAFTS || !ability.includes(':')) continue;
    const [res, act] = ability.split(':');
    const targets = res === '*' ? resources.filter((r) => !r.sensitive) : resources.filter((r) => r.key === res);
    for (const r of targets) {
      const actions = act === '*' ? r.actions : act === 'write' ? r.actions.filter((x) => x !== 'read') : [act as Action];
      actions.forEach((x) => r.actions.includes(x) && set.add(`${r.key}:${x}`));
    }
  }
  return set;
}

/** Inverse of toExplicit: collapses to `*:action` when every non-sensitive model has it. */
function compress(set: Set<string>, drafts: boolean, resources: ApiPermissionResource[]): string[] {
  const out: string[] = [];
  for (const action of ACTIONS) {
    const open = resources.filter((r) => !r.sensitive && r.actions.includes(action));
    const all = open.length > 0 && open.every((r) => set.has(`${r.key}:${action}`));
    if (all) out.push(`*:${action}`);
    for (const r of resources) {
      if (r.actions.includes(action) && set.has(`${r.key}:${action}`) && !(all && !r.sensitive)) out.push(`${r.key}:${action}`);
    }
  }
  if (drafts) out.push(DRAFTS);
  return out;
}

const METHOD_STYLES: Record<string, string> = {
  GET: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  POST: 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400',
  PUT: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  PATCH: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  DELETE: 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400',
};

type ApiKeyRow = ApiSettings['keys'][number];
let lastRevealedKey: string | null = null;

export default function ApiTab({ data }: { data: ApiSettings }) {
  const page = usePage();
  const { currentTeam } = page.props as { currentTeam?: { slug: string } };
  const teamSlug = currentTeam!.slug;

  const [env] = useApiEnvironment();
  const [open, setOpen] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [keyToRevoke, setKeyToRevoke] = useState<ApiKeyRow | null>(null);
  const [endpointQuery, setEndpointQuery] = useState('');

  const form = useForm({ name: '', abilities: ['*:read'] as string[], expires_at: '' });
  const [keyToEdit, setKeyToEdit] = useState<ApiKeyRow | null>(null);
  const [editAbilities, setEditAbilities] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const resources = useMemo(() => data.permissions.groups.flatMap((g) => g.resources), [data.permissions]);
  const editRestricted = keyToEdit?.environment === 'test' && !data.summary.test_keys_can_write;

  useEffect(() => {
    const key = data.plain_text_key;
    if (key && key !== lastRevealedKey) {
      lastRevealedKey = key;
      setRevealedKey(key);
    }
  }, [data.plain_text_key]);

  // In Test, keys are read-only unless the backend opted in (settings.test_keys_can_write).
  const writeRestricted = env === 'test' && !data.summary.test_keys_can_write;

  // Switching to Test drops any write ability that was already ticked.
  useEffect(() => {
    if (!writeRestricted) return;
    const cleaned = form.data.abilities.filter((a) => !isWrite(a));
    if (cleaned.length !== form.data.abilities.length) form.setData('abilities', cleaned);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [writeRestricted]);

  const keys = useMemo(() => data.keys.filter((k) => (k.environment ?? 'live') === env), [data.keys, env]);
  const counts = useMemo(
    () => ({
      live: data.keys.filter((k) => (k.environment ?? 'live') === 'live').length,
      test: data.keys.filter((k) => k.environment === 'test').length,
    }),
    [data.keys],
  );

  function createKey(e: React.FormEvent) {
    e.preventDefault();
    form.transform((d) => ({ ...d, environment: env }));
    form.post(storeApiKey(teamSlug).url, {
      preserveScroll: true,
      onSuccess: () => {
        setOpen(false);
        form.reset();
        toast.success('API key created.');
      },
    });
  }

  function revokeKey() {
    if (!keyToRevoke) return;
    router.delete(destroyApiKey({ current_team: teamSlug, apiKey: keyToRevoke.id }).url, {
      preserveScroll: true,
      onSuccess: () => setKeyToRevoke(null),
    });
  }

  function openEdit(key: ApiKeyRow) {
    setEditAbilities(key.abilities ?? []);
    setKeyToEdit(key);
  }

  function saveEdit() {
    if (!keyToEdit) return;
    setSaving(true);
    router.patch(
      updateApiKey({ current_team: teamSlug, apiKey: keyToEdit.id }).url,
      { abilities: editAbilities },
      {
        preserveScroll: true,
        onSuccess: () => {
          setKeyToEdit(null);
          toast.success('Permissions updated.');
        },
        onFinish: () => setSaving(false),
      },
    );
  }

  const endpoints = useMemo(() => {
    const q = endpointQuery.trim().toLowerCase();
    if (!q) return data.endpoints;
    return data.endpoints.filter(
      (ep) =>
        ep.uri.toLowerCase().includes(q) ||
        (ep.name ?? '').toLowerCase().includes(q) ||
        ep.methods.some((m) => m.toLowerCase().includes(q)),
    );
  }, [data.endpoints, endpointQuery]);

  const envLabel = env === 'test' ? 'test' : 'production';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">API access</h2>
          <p className="text-sm text-muted-foreground">
            Keys and webhooks are separate for test and production.
          </p>
        </div>
        <EnvironmentSwitch value={env} counts={counts} />
      </div>

      <SettingsSection
        title="REST API"
        description="Connection details for apps that call your API."
        actions={
          <Button variant="outline" size="sm" asChild>
            <a href={data.summary.openapi_url} target="_blank" rel="noreferrer">
              OpenAPI schema
              <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </a>
          </Button>
        }
      >
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <InfoTile label="Base URL" value={data.summary.base_url} copyable />
          <InfoTile label="Version" value={data.summary.version} />
          <InfoTile label="Rate limit" value={data.summary.rate_limit} />
          <InfoTile label="Authentication" value="Bearer token" />
        </dl>
      </SettingsSection>

      <SettingsSection
        title="GraphQL"
        description="Query exactly the data you need from a single endpoint."
        actions={
          <Badge
            variant="outline"
            className={cn(
              'gap-1.5',
              data.summary.graphql.enabled
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                : 'text-muted-foreground',
            )}
          >
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                data.summary.graphql.enabled ? 'bg-emerald-500' : 'bg-muted-foreground/50',
              )}
            />
            {data.summary.graphql.enabled ? 'Enabled' : 'Disabled'}
          </Badge>
        }
      >
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <InfoTile label="Endpoint" value={data.summary.graphql.endpoint} copyable />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={data.summary.graphql.endpoint}>Schema</a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={data.summary.graphql.playground} target="_blank" rel="noreferrer">
                Open playground
                <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        title={env === 'test' ? 'Test API keys' : 'Production API keys'}
        description={
          env === 'test'
            ? 'For staging and preview sites. Prefixed cms_test_.'
            : 'For live sites and apps. Treat them like passwords. Prefixed cms_live_.'
        }
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <KeyRound className="mr-1.5 h-3.5 w-3.5" />
                New {envLabel} key
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create {envLabel} API key</DialogTitle>
                <DialogDescription>
                  Give it only the permissions the app needs. You can revoke it at any time.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={createKey} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="key-name">Name</Label>
                  <Input
                    id="key-name"
                    value={form.data.name}
                    onChange={(e) => form.setData('name', e.target.value)}
                    placeholder={env === 'test' ? 'Staging site' : 'Marketing site'}
                    autoFocus
                  />
                  {form.errors.name && <p className="text-xs text-destructive">{form.errors.name}</p>}
                </div>

                <AbilitiesPicker
                  value={form.data.abilities}
                  onChange={(next) => form.setData('abilities', next)}
                  catalog={data.permissions}
                  resources={resources}
                  readOnlyOnly={writeRestricted}
                />
                {form.errors.abilities && <p className="text-xs text-destructive">{form.errors.abilities}</p>}

                <div className="space-y-2">
                  <Label htmlFor="key-expires">Expires on</Label>
                  <Input
                    id="key-expires"
                    type="date"
                    value={form.data.expires_at}
                    onChange={(e) => form.setData('expires_at', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Leave empty for a key that never expires.</p>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={form.processing || !form.data.name || form.data.abilities.length === 0}
                  >
                    Create key
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      >
        {env === 'test' && <SandboxNotice canWrite={data.summary.test_keys_can_write} />}

        <RevealedKeyDialog value={revealedKey} onClose={() => setRevealedKey(null)} />

        {keys.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-10 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <KeyRound className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No {envLabel} keys yet</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              Create a {envLabel} key to start calling the API from your {env === 'test' ? 'staging' : 'live'} apps.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="min-w-[140px]">Name</TableHead>
                  <TableHead className="min-w-[160px]">Key</TableHead>
                  <TableHead className="min-w-[200px]">Abilities</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last used</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.name}</TableCell>

                    <TableCell>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(key.key_prefix)}
                        title="Copy prefix"
                        className="group inline-flex items-center gap-2 rounded-md bg-muted px-2 py-1 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {key.key_prefix}…
                        <Copy className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
                      </button>
                    </TableCell>

                    <TableCell>
                      <AbilityBadges abilities={key.abilities ?? []} resources={resources} />
                    </TableCell>

                    <TableCell>
                      <KeyStatus expiresAt={key.expires_at} />
                    </TableCell>

                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {key.last_used_at ?? 'Never'}
                    </TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8" aria-label={`Actions for ${key.name}`}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(key)}>
                            <Pencil className="mr-2 h-3.5 w-3.5" />
                            Edit permissions
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              router.post(
                                regenerateApiKey({ current_team: teamSlug, apiKey: key.id }).url,
                                {},
                                { preserveScroll: true },
                              )
                            }
                          >
                            <RotateCw className="mr-2 h-3.5 w-3.5" />
                            Regenerate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setKeyToRevoke(key)}
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            Revoke
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

      <Dialog open={!!keyToEdit} onOpenChange={(v) => !v && setKeyToEdit(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Permissions · {keyToEdit?.name}</DialogTitle>
            <DialogDescription>Changes apply immediately. The key itself does not change.</DialogDescription>
          </DialogHeader>
          {keyToEdit && (
            <AbilitiesPicker
              value={editAbilities}
              onChange={setEditAbilities}
              catalog={data.permissions}
              resources={resources}
              readOnlyOnly={!!editRestricted}
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setKeyToEdit(null)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={saving || editAbilities.length === 0}>Save permissions</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!keyToRevoke} onOpenChange={(v) => !v && setKeyToRevoke(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Revoke “{keyToRevoke?.name}”?</DialogTitle>
            <DialogDescription>
              Any app using this key will stop working immediately. This can’t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setKeyToRevoke(null)}>Cancel</Button>
            <Button variant="destructive" onClick={revokeKey}>Revoke key</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SettingsSection
        title="Endpoints"
        description="Detected automatically from your routes, so it’s always up to date."
        actions={
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={endpointQuery}
              onChange={(e) => setEndpointQuery(e.target.value)}
              placeholder="Search endpoints"
              className="h-8 pl-8"
              aria-label="Search endpoints"
            />
          </div>
        }
      >
        <div className="max-h-[480px] overflow-auto rounded-lg border">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted">
              <TableRow className="hover:bg-muted">
                <TableHead className="w-28">Method</TableHead>
                <TableHead>URI</TableHead>
                <TableHead className="hidden md:table-cell">Name</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {endpoints.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                    No endpoints match “{endpointQuery}”.
                  </TableCell>
                </TableRow>
              ) : (
                endpoints.map((ep) => (
                  <TableRow key={ep.uri + ep.methods.join()}>
                    <TableCell>
                      <div className="flex gap-1">
                        {ep.methods.map((m) => (
                          <Badge
                            key={m}
                            variant="outline"
                            className={cn('font-mono text-[11px] font-semibold', METHOD_STYLES[m])}
                          >
                            {m}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{ep.uri}</TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {ep.name ?? '—'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground">
          Showing {endpoints.length} of {data.endpoints.length} endpoints.
        </p>
      </SettingsSection>
    </div>
  );
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  toast.success('Copied to clipboard.');
}

function InfoTile({ label, value, copyable = false }: { label: string; value: string; copyable?: boolean }) {
  return (
    <div className="min-w-0 rounded-lg border bg-muted/30 px-3 py-2.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 flex items-center justify-between gap-2">
        <span className="truncate font-mono text-sm" title={value}>{value}</span>
        {copyable && (
          <button
            type="button"
            onClick={() => copyToClipboard(value)}
            aria-label={`Copy ${label}`}
            className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        )}
      </dd>
    </div>
  );
}

function RevealedKeyDialog({ value, onClose }: { value: string | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success('Copied to clipboard.');
    setTimeout(() => setCopied(false), 2000);
  }

  function close() {
    setCopied(false);
    onClose();
  }

  return (
    <Dialog open={!!value} onOpenChange={(v) => !v && close()}>
      {/* Clic fuera deshabilitado para no perder la key por accidente */}
      <DialogContent className="sm:max-w-lg" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Your new API key</DialogTitle>
          <DialogDescription>
            Copy it now and store it somewhere safe. For security, we can’t show it again.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-2">
          <code className="min-w-0 flex-1 break-all rounded-md border bg-muted px-3 py-2 font-mono text-sm">
            {value}
          </code>
          <Button size="sm" variant="outline" onClick={handleCopy} className="shrink-0">
            {copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>

        <DialogFooter>
          <Button onClick={close}>{copied ? 'Done' : 'I’ve copied it'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function KeyStatus({ expiresAt }: { expiresAt?: string | null }) {
  const expired = !!expiresAt && new Date(expiresAt).getTime() < Date.now();

  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1.5 font-normal',
        expired
          ? 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400'
          : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', expired ? 'bg-red-500' : 'bg-emerald-500')} />
      {expired ? 'Expired' : 'Active'}
    </Badge>
  );
}

/** Hygraph-style permissions: presets + model × operation matrix. Test keys can only read. */
function AbilitiesPicker({
  value,
  onChange,
  catalog,
  resources,
  readOnlyOnly,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  catalog: ApiPermissions;
  resources: ApiPermissionResource[];
  readOnlyOnly: boolean;
}) {
  const full = value.includes('*');
  const drafts = value.includes(DRAFTS);
  const explicit = useMemo(() => toExplicit(value, resources), [value, resources]);
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({ customer: true, restricted: true });

  const presets = catalog.presets.filter((p) => !readOnlyOnly || p.test);
  const active = full
    ? 'full'
    : (presets.find((p) => p.id !== 'custom' && sameSet(value, p.abilities))?.id ?? 'custom');

  const locked = (action: Action) => full || (readOnlyOnly && action !== 'read');
  const has = (r: ApiPermissionResource, a: Action) => explicit.has(`${r.key}:${a}`);

  function emit(set: Set<string>, withDrafts = drafts) {
    onChange(compress(set, withDrafts, resources));
  }

  function toggleCell(r: ApiPermissionResource, action: Action, checked: boolean) {
    const next = new Set(explicit);
    const k = `${r.key}:${action}`;
    if (checked) next.add(k);
    else next.delete(k);
    emit(next);
  }

  function toggleColumn(group: ApiPermissionGroup, action: Action, checked: boolean) {
    const next = new Set(explicit);
    group.resources
      .filter((r) => r.actions.includes(action))
      .forEach((r) => (checked ? next.add(`${r.key}:${action}`) : next.delete(`${r.key}:${action}`)));
    emit(next);
  }

  const q = query.trim().toLowerCase();
  const groups = catalog.groups
    .map((g) => ({
      ...g,
      resources: g.resources.filter((r) => !q || r.label.toLowerCase().includes(q) || r.key.includes(q)),
    }))
    .filter((g) => g.resources.length > 0);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Access level</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => p.id !== 'custom' && onChange(p.abilities)}
              className={cn(
                'rounded-lg border p-3 text-left transition-colors hover:bg-muted/40',
                active === p.id && 'border-primary/60 bg-primary/5',
              )}
            >
              <span className="block text-sm font-medium">{p.label}</span>
              <span className="block text-xs text-muted-foreground">{p.description}</span>
            </button>
          ))}
          <button
            type="button"
            disabled={readOnlyOnly}
            onClick={() => onChange(['*'])}
            className={cn(
              'rounded-lg border p-3 text-left transition-colors hover:bg-muted/40 disabled:pointer-events-none disabled:opacity-50',
              active === 'full' && 'border-amber-500/60 bg-amber-500/5',
            )}
          >
            <span className="block text-sm font-medium">Full access</span>
            <span className="block text-xs text-muted-foreground">
              {readOnlyOnly ? 'Not available for test keys.' : 'Every model and operation, including restricted ones. Use with care.'}
            </span>
          </button>
        </div>
      </div>

      <label className={cn('flex items-start gap-3 rounded-lg border p-3', full ? 'pointer-events-none opacity-50' : 'cursor-pointer')}>
        <Checkbox className="mt-0.5" checked={drafts || full} disabled={full} onCheckedChange={(c) => emit(explicit, !!c)} />
        <span>
          <span className="block text-sm font-medium">Include drafts</span>
          <span className="block text-xs text-muted-foreground">
            Also return unpublished content. Without this, the key only sees published content.
          </span>
        </span>
      </label>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Label>Models</Label>
          <div className="relative w-48">
            <Search className="pointer-events-none absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search models" className="h-7 pl-7 text-xs" />
          </div>
        </div>

        <div className={cn('overflow-hidden rounded-lg border', full && 'pointer-events-none opacity-50')}>
          <div className="grid grid-cols-[1fr_repeat(4,56px)] bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <span>Model</span>
            {ACTIONS.map((a) => (
              <span key={a} className="text-center">{cap(a)}</span>
            ))}
          </div>

          {groups.map((group) => {
            const isCollapsed = !q && collapsed[group.key];
            return (
              <div key={group.key} className="border-t">
                <div className="grid grid-cols-[1fr_repeat(4,56px)] items-center bg-muted/20 px-3 py-2">
                  <button
                    type="button"
                    className="flex items-center gap-1.5 text-left text-sm font-medium"
                    onClick={() => setCollapsed((c) => ({ ...c, [group.key]: !c[group.key] }))}
                  >
                    <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', isCollapsed && '-rotate-90')} />
                    {group.label}
                    <span className="text-xs font-normal text-muted-foreground">({group.resources.length})</span>
                  </button>
                  {ACTIONS.map((action) => {
                    const apply = group.resources.filter((r) => r.actions.includes(action));
                    if (apply.length === 0) return <span key={action} />;
                    const n = apply.filter((r) => has(r, action)).length;
                    return (
                      <span key={action} className="flex justify-center">
                        <Checkbox
                          aria-label={`${group.label} ${action}`}
                          disabled={locked(action)}
                          checked={n === apply.length ? true : n > 0 ? 'indeterminate' : false}
                          onCheckedChange={(c) => toggleColumn(group, action, c === true)}
                        />
                      </span>
                    );
                  })}
                </div>

                {!isCollapsed && (
                  <>
                    <p className="px-3 pb-1 pt-2 text-xs text-muted-foreground">{group.description}</p>
                    {group.resources.map((r) => (
                      <div key={r.key} className="grid grid-cols-[1fr_repeat(4,56px)] items-center border-t px-3 py-2">
                        <span className="text-sm">
                          {r.label}
                          {r.sensitive && (
                            <Badge variant="outline" className="ml-2 px-1.5 py-0 text-[10px] font-normal text-muted-foreground">
                              explicit
                            </Badge>
                          )}
                        </span>
                        {ACTIONS.map((action) =>
                          r.actions.includes(action) ? (
                            <span key={action} className={cn('flex justify-center', locked(action) && action !== 'read' && 'opacity-40')}>
                              <Checkbox
                                aria-label={`${r.key}:${action}`}
                                disabled={locked(action)}
                                checked={has(r, action)}
                                onCheckedChange={(c) => toggleCell(r, action, c === true)}
                              />
                            </span>
                          ) : (
                            <span key={action} className="text-center text-xs text-muted-foreground/50">—</span>
                          ),
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          “Explicit” models hold personal or financial data and are never included by “read all”. Operations a model does not support are shown as —.
        </p>
      </div>
    </div>
  );
}

/** Compact summary of a key's permissions for the table. */
function AbilityBadges({ abilities, resources }: { abilities: string[]; resources: ApiPermissionResource[] }) {
  if (abilities.includes('*')) {
    return (
      <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400">
        Full access
      </Badge>
    );
  }

  const set = toExplicit(abilities, resources);
  const badges: { id: string; label: string; title: string }[] = [];

  for (const action of ACTIONS) {
    const keys = [...set].filter((s) => s.endsWith(`:${action}`)).map((s) => s.slice(0, -(action.length + 1)));
    if (keys.length === 0) continue;
    const all = abilities.includes(`*:${action}`);
    badges.push({
      id: action,
      label: `${cap(action)} · ${all ? 'all models' : `${keys.length} ${keys.length === 1 ? 'model' : 'models'}`}`,
      title: keys.join(', '),
    });
  }

  if (abilities.includes(DRAFTS)) badges.push({ id: 'drafts', label: 'Includes drafts', title: 'Can read unpublished content' });

  const known = new Set(resources.map((r) => r.key));
  const legacy = abilities.filter((a) => a !== DRAFTS && !a.startsWith('*:') && !known.has(a.split(':')[0]));

  return (
    <div className="flex flex-wrap gap-1">
      {badges.map((b) => (
        <Badge key={b.id} variant="secondary" title={b.title} className="text-[11px] font-normal">
          {b.label}
        </Badge>
      ))}
      {legacy.map((a) => (
        <Badge key={a} variant="outline" title="Legacy permission" className="font-mono text-[11px] font-normal text-muted-foreground">
          {a}
        </Badge>
      ))}
    </div>
  );
}