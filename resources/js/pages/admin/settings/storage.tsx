import { updateStorage } from '@/actions/App/Http/Controllers/Admin/SettingController';
import Heading from '@/components/heading';
import { DriverLogo } from '@/components/settings/driver-logo';
import { SecretInput } from '@/components/settings/secret-input';
import { FeatureRow, Field, Section } from '@/components/settings/settings-primitives';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { StorageSettings } from '@/types/settings';
import { useForm, usePage } from '@inertiajs/react';
import { Check, Link2, Loader2 } from 'lucide-react';
import { useRef } from 'react';
import { toast } from 'sonner';

/** Cuota de referencia para la barra de uso (la misma que usaba la pestaña antes). */
const QUOTA_BYTES = 10 * 1024 ** 3;
const QUOTA_LABEL = '10 GB';

type DriverInfo = {
  value: string;
  label: string;
  description: string;
  placeholders?: { region?: string; endpoint?: string };
};

const DRIVERS: DriverInfo[] = [
  { value: 'local', label: 'Local disk', description: 'Store files on this server’s disk.' },
  { value: 's3', label: 'Amazon S3', description: 'Scalable object storage from AWS.', placeholders: { region: 'us-east-1' } },
  {
    value: 'r2',
    label: 'Cloudflare R2',
    description: 'S3-compatible storage with no egress fees.',
    placeholders: { region: 'auto', endpoint: 'https://<account-id>.r2.cloudflarestorage.com' },
  },
  {
    value: 'spaces',
    label: 'DigitalOcean Spaces',
    description: 'S3-compatible object storage.',
    placeholders: { region: 'nyc3', endpoint: 'https://nyc3.digitaloceanspaces.com' },
  },
  { value: 'gcs', label: 'Google Cloud Storage', description: 'Object storage from Google Cloud.' },
  {
    value: 'backblaze',
    label: 'Backblaze B2',
    description: 'Low-cost S3-compatible storage.',
    placeholders: { region: 'us-west-004', endpoint: 'https://s3.us-west-004.backblazeb2.com' },
  },
  { value: 'azure', label: 'Azure Blob Storage', description: 'Object storage from Microsoft Azure.' },
];

type Creds = {
  key: string;
  secret: string;
  region: string;
  bucket: string;
  endpoint: string;
  url: string;
  use_path_style_endpoint: boolean;
};

const BLANK: Creds = { key: '', secret: '', region: '', bucket: '', endpoint: '', url: '', use_path_style_endpoint: false };

const pickCreds = (d: Creds): Creds => ({
  key: d.key,
  secret: d.secret,
  region: d.region,
  bucket: d.bucket,
  endpoint: d.endpoint,
  url: d.url,
  use_path_style_endpoint: d.use_path_style_endpoint,
});

export default function StorageTab({ data }: { data: StorageSettings }) {
  const { currentTeam } = usePage().props as { currentTeam?: { slug: string } };
  const teamSlug = currentTeam!.slug;
  const s = data.settings;

  const saved: Creds = {
    key: s.key ?? '',
    secret: s.secret ?? '',
    region: s.region ?? '',
    bucket: s.bucket ?? '',
    endpoint: s.endpoint ?? '',
    url: s.url ?? '',
    use_path_style_endpoint: s.use_path_style_endpoint ?? false,
  };
  const savedDriver = s.driver ?? 'local';

  const form = useForm({ driver: savedDriver, ...saved });
  const errors = form.errors as Record<string, string | undefined>;

  const active = DRIVERS.find((d) => d.value === form.data.driver);
  const isCloud = form.data.driver !== 'local';

  // Credenciales por driver: al volver a uno anterior se restauran, no se pierden.
  const cache = useRef<Record<string, Creds>>({ [savedDriver]: saved });

  const setText = (k: Exclude<keyof Creds, 'use_path_style_endpoint'>) => (v: string) =>
    form.setData((prev) => ({ ...prev, [k]: v }));

  function changeDriver(driver: string) {
    if (driver === form.data.driver) return;
    cache.current[form.data.driver] = pickCreds(form.data);
    form.setData((prev) => ({ ...prev, ...(cache.current[driver] ?? BLANK), driver }));
  }

  function discard() {
    cache.current = { [savedDriver]: saved };
    form.reset();
    form.clearErrors();
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    form.patch(updateStorage(teamSlug).url, {
      preserveScroll: true,
      onSuccess: () => toast.success('Storage settings saved.'),
    });
  }

  const used = data.usage.used_bytes;
  const pct = Math.min(100, (used / QUOTA_BYTES) * 100);

  return (
    <div className="space-y-10">

      <form onSubmit={submit} className="space-y-10">
        {/* ---------------- Usage ---------------- */}
        <Section title="Usage">
          <div className="rounded-xl border border-border/60 p-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-2xl font-semibold tracking-tight">{data.usage.used_human}</p>
                <p className="text-sm text-muted-foreground">used of {QUOTA_LABEL}</p>
              </div>
              <span className={cn('text-sm font-medium tabular-nums', pct >= 90 ? 'text-destructive' : 'text-muted-foreground')}>
                {pct.toFixed(pct < 10 ? 1 : 0)}%
              </span>
            </div>
            <Progress
              value={pct}
              aria-label="Storage used"
              className={cn('mt-4 h-2', pct >= 90 && '[&>div]:bg-destructive')}
            />
          </div>
        </Section>

        <hr className="border-border/60" />

        {/* ---------------- Driver ---------------- */}
        <Section title="Storage driver" description="Choose where files are kept. Changing it doesn’t move existing files.">
          <div role="radiogroup" aria-label="Storage driver" className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {DRIVERS.map((d) => {
              const selected = form.data.driver === d.value;

              return (
                <button
                  key={d.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => changeDriver(d.value)}
                  className={cn(
                    'flex items-start gap-3 rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    selected ? 'border-primary/60 bg-primary/5' : 'border-border/60 hover:bg-muted/40',
                  )}
                >
                  <DriverLogo driver={d.value} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{d.label}</span>
                    <span className="mt-0.5 line-clamp-2 block text-sm text-muted-foreground">{d.description}</span>
                  </span>
                  {selected && <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />}
                </button>
              );
            })}
          </div>
          {errors.driver && <p className="text-xs text-destructive">{errors.driver}</p>}
        </Section>

        {/* ---------------- Connection ---------------- */}
        <hr className="border-border/60" />

        <Section
          title={isCloud ? `${active?.label ?? 'Cloud'} connection` : 'Local storage'}
          description={isCloud ? 'Credentials and location of your bucket.' : undefined}
        >
          {!isCloud ? (
            <p className="rounded-xl border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
              Files are stored on this server’s local disk. No credentials are needed.
            </p>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Access key" htmlFor="st-key" error={errors.key}>
                  <Input id="st-key" autoComplete="off" value={form.data.key} onChange={(e) => setText('key')(e.target.value)} />
                </Field>
                <Field label="Secret key" htmlFor="st-secret" error={errors.secret}>
                  <SecretInput id="st-secret" value={form.data.secret} onChange={setText('secret')} />
                </Field>
                <Field label="Region" htmlFor="st-region" error={errors.region}>
                  <Input
                    id="st-region"
                    placeholder={active?.placeholders?.region}
                    value={form.data.region}
                    onChange={(e) => setText('region')(e.target.value)}
                  />
                </Field>
                <Field label="Bucket" htmlFor="st-bucket" error={errors.bucket}>
                  <Input id="st-bucket" value={form.data.bucket} onChange={(e) => setText('bucket')(e.target.value)} />
                </Field>
                <Field label="Endpoint" description="Leave empty for the provider’s default." htmlFor="st-endpoint" error={errors.endpoint}>
                  <Input
                    id="st-endpoint"
                    type="url"
                    placeholder={active?.placeholders?.endpoint ?? 'https://'}
                    value={form.data.endpoint}
                    onChange={(e) => setText('endpoint')(e.target.value)}
                  />
                </Field>
                <Field label="Public URL" description="Base address used to serve files, e.g. a CDN." htmlFor="st-url" error={errors.url}>
                  <Input
                    id="st-url"
                    type="url"
                    placeholder="https://cdn.example.com"
                    value={form.data.url}
                    onChange={(e) => setText('url')(e.target.value)}
                  />
                </Field>
              </div>

              <FeatureRow
                icon={Link2}
                tone="amber"
                title="Use path-style endpoint"
                description="Address the bucket in the URL path instead of the subdomain. Needed by some S3-compatible providers."
                control={
                  <Switch
                    checked={form.data.use_path_style_endpoint}
                    onCheckedChange={(v) => form.setData((prev) => ({ ...prev, use_path_style_endpoint: v }))}
                    aria-label="Use path-style endpoint"
                  />
                }
              />
            </div>
          )}
        </Section>

        {/* ---------------- Save ---------------- */}
        <div className="flex items-center justify-end gap-3 border-t border-border/60 pt-5">
          {form.isDirty && <span className="mr-auto text-sm text-muted-foreground">You have unsaved changes.</span>}
          <Button type="button" variant="ghost" onClick={discard} disabled={!form.isDirty || form.processing}>
            Discard
          </Button>
          <Button type="submit" disabled={!form.isDirty || form.processing} aria-busy={form.processing} className="min-w-36">
            {form.processing ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" /> Saving…
              </>
            ) : (
              'Save changes'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}