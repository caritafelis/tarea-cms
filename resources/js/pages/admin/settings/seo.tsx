import { generateSeoFile, updateSeo } from '@/actions/App/Http/Controllers/Admin/SettingController';
import Heading from '@/components/heading';
import { Field, FeatureRow, Section, type Tone } from '@/components/settings/settings-primitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { SeoSettings } from '@/types/settings';
import { router, useForm, usePage } from '@inertiajs/react';
import { Bot, ExternalLink, FileCode2, FileText, Loader2, RefreshCw, Rss, X, type LucideIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

/* ------------------------------ helpers ------------------------------ */

const CARD_TYPES = [
  { value: 'summary', label: 'Summary' },
  { value: 'summary_large_image', label: 'Summary with large image' },
  { value: 'app', label: 'App' },
  { value: 'player', label: 'Player' },
];

const ROBOTS_ALLOW = 'User-agent: *\nAllow: /';
const ROBOTS_BLOCK = 'User-agent: *\nDisallow: /';

const JSON_LD_TEMPLATE = JSON.stringify(
  { '@context': 'https://schema.org', '@type': 'Organization', name: '', url: '', logo: '' },
  null,
  2,
);

function Counter({ value, max }: { value: number; max: number }) {
  return (
    <span className={cn('text-xs tabular-nums', value > max * 0.9 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground')}>
      {value}/{max}
    </span>
  );
}

/** Cómo se vería el resultado en Google, con los datos que estás escribiendo. */
function SerpPreview({ title, description, url }: { title: string; description: string; url: string }) {
  let host = '';
  let path = '';
  try {
    const u = new URL(url || (typeof window !== 'undefined' ? window.location.origin : 'https://example.com'));
    host = u.host;
    path = u.pathname.replace(/\/$/, '').split('/').filter(Boolean).join(' › ');
  } catch {
    host = url;
  }

  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 p-4" aria-label="Search result preview">
      <p className="truncate text-xs text-muted-foreground">{host}{path && ` › ${path}`}</p>
      <p className="mt-1 truncate text-lg leading-snug text-[#1a0dab] dark:text-[#8ab4f8]">{title || 'Your page title appears here'}</p>
      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
        {description || 'Add a meta description to control the snippet shown under your title in search results.'}
      </p>
    </div>
  );
}

/** Keywords como chips; se guardan como texto separado por comas (mismo formato de antes). */
function KeywordsInput({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  const [draft, setDraft] = useState('');
  const list = value.split(',').map((s) => s.trim()).filter(Boolean);

  function commit(raw: string) {
    const add = raw.split(',').map((s) => s.trim()).filter((k) => k && !list.includes(k));
    if (add.length) onChange([...list, ...add].join(', '));
    setDraft('');
  }

  return (
    <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-2 py-1.5 shadow-xs focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/30">
      {list.map((k) => (
        <Badge key={k} variant="secondary" className="gap-1">
          {k}
          <button type="button" aria-label={`Remove ${k}`} onClick={() => onChange(list.filter((x) => x !== k).join(', '))}>
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <input
        id={id}
        className="min-w-32 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        value={draft}
        placeholder={list.length ? '' : 'Add a keyword and press Enter'}
        onChange={(e) => (e.target.value.includes(',') ? commit(e.target.value) : setDraft(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit(draft);
          } else if (e.key === 'Backspace' && !draft && list.length) {
            onChange(list.slice(0, -1).join(', '));
          }
        }}
        onBlur={() => draft && commit(draft)}
      />
    </div>
  );
}

/** Ícono y color según el tipo de archivo público. */
function fileMeta(path: string): { icon: LucideIcon; tone: Tone } {
  const p = path.toLowerCase();
  if (p.includes('sitemap')) return { icon: FileCode2, tone: 'green' };
  if (p.includes('rss') || p.includes('feed')) return { icon: Rss, tone: 'amber' };
  if (p.includes('llms') || p.includes('ai')) return { icon: Bot, tone: 'violet' };
  return { icon: FileText, tone: 'blue' };
}

/* -------------------------------- tab -------------------------------- */

export default function SeoTab({ data }: { data: SeoSettings }) {
  const { currentTeam } = usePage().props as { currentTeam?: { slug: string } };
  const teamSlug = currentTeam!.slug;
  const [busyFile, setBusyFile] = useState<string | null>(null);

  const form = useForm({
    meta_title: data.meta.meta_title ?? '',
    meta_description: data.meta.meta_description ?? '',
    keywords: data.meta.keywords ?? '',
    robots: data.meta.robots ?? ROBOTS_ALLOW,
    canonical_url: data.meta.canonical_url ?? '',
    twitter_card_type: data.meta.twitter_card_type ?? 'summary_large_image',
    json_ld: data.meta.json_ld ?? '',
  });
  const errors = form.errors as Record<string, string | undefined>;
  const set = (key: keyof typeof form.data) => (value: string) =>
    form.setData((prev) => ({ ...prev, [key]: value }));

  const jsonState = useMemo<'empty' | 'valid' | 'invalid'>(() => {
    const v = form.data.json_ld.trim();
    if (!v) return 'empty';
    try {
      JSON.parse(v);
      return 'valid';
    } catch {
      return 'invalid';
    }
  }, [form.data.json_ld]);

  const cardTypes = CARD_TYPES.some((c) => c.value === form.data.twitter_card_type)
    ? CARD_TYPES
    : [{ value: form.data.twitter_card_type, label: form.data.twitter_card_type }, ...CARD_TYPES];

  function submit(e: React.FormEvent) {
    e.preventDefault();
    form.patch(updateSeo(teamSlug).url, {
      preserveScroll: true,
      onSuccess: () => toast.success('SEO settings saved.'),
    });
  }

  function regenerate(type: string, path: string) {
    router.post(generateSeoFile([teamSlug, type]).url, {}, {
      preserveScroll: true,
      onStart: () => setBusyFile(path),
      onFinish: () => setBusyFile(null),
      onSuccess: () => toast.success(`${type} regenerated.`),
    });
  }

  return (
    <div className="space-y-10">
      <form onSubmit={submit} className="space-y-10">
        {/* ---------------- Search appearance ---------------- */}
        <Section title="Search appearance" description="Default title and description shown in search results.">
          <SerpPreview title={form.data.meta_title} description={form.data.meta_description} url={form.data.canonical_url} />

          <Field
            label="Meta title"
            htmlFor="meta_title"
            error={errors.meta_title}
            aside={<Counter value={form.data.meta_title.length} max={70} />}
          >
            <Input id="meta_title" maxLength={70} value={form.data.meta_title} onChange={(e) => set('meta_title')(e.target.value)} />
          </Field>

          <Field
            label="Meta description"
            htmlFor="meta_description"
            error={errors.meta_description}
            aside={<Counter value={form.data.meta_description.length} max={160} />}
          >
            <Textarea
              id="meta_description"
              rows={3}
              maxLength={160}
              value={form.data.meta_description}
              onChange={(e) => set('meta_description')(e.target.value)}
            />
          </Field>

          <Field label="Keywords" description="Press Enter after each keyword." htmlFor="keywords" error={errors.keywords}>
            <KeywordsInput id="keywords" value={form.data.keywords} onChange={set('keywords')} />
          </Field>

          <Field
            label="Canonical URL"
            description="The preferred address of your site. Also used as the base for the preview."
            htmlFor="canonical_url"
            error={errors.canonical_url}
          >
            <Input
              id="canonical_url"
              type="url"
              placeholder="https://example.com"
              value={form.data.canonical_url}
              onChange={(e) => set('canonical_url')(e.target.value)}
            />
          </Field>
        </Section>

        <hr className="border-border/60" />

        {/* ---------------- Social ---------------- */}
        <Section title="Social sharing" description="How links to your site look when shared on social networks.">
          <Field label="Twitter card type" htmlFor="twitter_card_type" error={errors.twitter_card_type}>
            <Select value={form.data.twitter_card_type} onValueChange={set('twitter_card_type')}>
              <SelectTrigger id="twitter_card_type" className="w-full sm:w-72"><SelectValue /></SelectTrigger>
              <SelectContent>
                {cardTypes.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </Section>

        <hr className="border-border/60" />

        {/* ---------------- Crawlers ---------------- */}
        <Section title="Crawlers" description="Directives served to search engine bots.">
          <Field
            label="Robots directives"
            htmlFor="robots"
            error={errors.robots}
            aside={
              <span className="flex gap-1">
                <Button type="button" size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => set('robots')(ROBOTS_ALLOW)}>
                  Allow all
                </Button>
                <Button type="button" size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => set('robots')(ROBOTS_BLOCK)}>
                  Block all
                </Button>
              </span>
            }
          >
            <Textarea id="robots" rows={4} className="font-mono text-sm" value={form.data.robots} onChange={(e) => set('robots')(e.target.value)} />
          </Field>
        </Section>

        <hr className="border-border/60" />

        {/* ---------------- Structured data ---------------- */}
        <Section title="Structured data" description="JSON-LD injected site-wide to help search engines understand your site.">
          <Field
            label="JSON-LD"
            htmlFor="json_ld"
            error={errors.json_ld}
            aside={
              jsonState === 'valid' ? (
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400">Valid JSON</Badge>
              ) : jsonState === 'invalid' ? (
                <Badge variant="outline" className="border-destructive/40 text-destructive">Invalid JSON</Badge>
              ) : (
                <Button type="button" size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => set('json_ld')(JSON_LD_TEMPLATE)}>
                  Use template
                </Button>
              )
            }
          >
            <Textarea
              id="json_ld"
              rows={8}
              className="font-mono text-sm"
              placeholder='{ "@context": "https://schema.org", "@type": "Organization" }'
              value={form.data.json_ld}
              onChange={(e) => set('json_ld')(e.target.value)}
            />
          </Field>
        </Section>

        {/* ---------------- Save ---------------- */}
        <div className="flex items-center justify-end gap-3 border-t border-border/60 pt-5">
          {jsonState === 'invalid' ? (
            <span className="mr-auto text-sm text-destructive">Fix the JSON-LD to save.</span>
          ) : (
            form.isDirty && <span className="mr-auto text-sm text-muted-foreground">You have unsaved changes.</span>
          )}
          <Button type="button" variant="ghost" onClick={() => form.reset()} disabled={!form.isDirty || form.processing}>
            Discard
          </Button>
          <Button type="submit" disabled={!form.isDirty || form.processing || jsonState === 'invalid'} aria-busy={form.processing} className="min-w-36">
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

      {/* Fuera del <form>: estos botones no deben enviar los metadatos. */}
      <Section title="Public files" description="Sitemap, feeds and AI crawler files served at the site root.">
        <div className="space-y-6">
          {data.files.length === 0 && <p className="text-sm text-muted-foreground">No public files configured.</p>}
          {data.files.map((file) => {
            const type = file.path.replace(/^\//, '').split('/')[0].replace('.xml', '').replace('.txt', '');
            const { icon, tone } = fileMeta(file.path);
            const busy = busyFile === file.path;

            return (
              <FeatureRow
                key={file.path}
                icon={icon}
                tone={tone}
                title={file.label}
                description={
                  <span className="flex flex-wrap items-center gap-2">
                    <code className="font-mono text-xs">{file.path}</code>
                    <Badge
                      variant="outline"
                      className={cn(file.exists && 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400')}
                    >
                      {file.exists ? 'Generated' : 'Not generated'}
                    </Badge>
                  </span>
                }
                control={
                  <div className="flex gap-2">
                    {file.exists && (
                      <Button type="button" size="sm" variant="ghost" asChild>
                        <a href={file.path} target="_blank" rel="noreferrer">
                          <ExternalLink className="mr-1.5 size-3.5" /> Open
                        </a>
                      </Button>
                    )}
                    <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => regenerate(type, file.path)}>
                      {busy ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : <RefreshCw className="mr-1.5 size-3.5" />}
                      {file.exists ? 'Regenerate' : 'Generate'}
                    </Button>
                  </div>
                }
              />
            );
          })}
        </div>
      </Section>
    </div>
  );
}