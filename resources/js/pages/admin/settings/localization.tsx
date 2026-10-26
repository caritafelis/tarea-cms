import { useEntitlements } from '@/hooks/use-entitlements';
import { updateLocalization } from '@/actions/App/Http/Controllers/Admin/SettingController';
import { SettingsSection } from '@/components/settings/settings-section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { LocalizationSettings } from '@/types/settings';
import { useForm, usePage } from '@inertiajs/react';
import { Globe, Loader2, Plus, Search, Star, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const COMMON = ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'sv', 'pl', 'tr', 'ru', 'uk', 'ar', 'he', 'fa', 'hi', 'zh', 'ja', 'ko', 'id', 'vi', 'th'];
const RTL = new Set(['ar', 'he', 'fa', 'ur', 'ps', 'sd', 'yi']);

function safe<T>(fn: () => T | undefined, fallback: T): T {
  try {
    return fn() ?? fallback;
  } catch {
    return fallback;
  }
}

const langName = (code: string, inLocale = 'en') => safe(() => new Intl.DisplayNames([inLocale], { type: 'language' }).of(code), code);
const nativeName = (code: string) => {
  const n = langName(code, code);
  return n.charAt(0).toLocaleUpperCase(code) + n.slice(1);
};

const TIMEZONES: string[] = (() => {
  const list = safe(() => (Intl as unknown as { supportedValuesOf: (k: string) => string[] }).supportedValuesOf('timeZone'), [
    'America/Guayaquil', 'America/New_York', 'America/Mexico_City', 'Europe/Madrid', 'Europe/London', 'Asia/Tokyo',
  ]);
  return ['UTC', ...list.filter((z) => z !== 'UTC')];
})();

export default function LocalizationTab({ data }: { data: LocalizationSettings }) {
  const { currentTeam } = usePage().props as { currentTeam?: { slug: string } };
  const teamSlug = currentTeam!.slug;

  const form = useForm({
    default_locale: data.default_locale,
    active_locales: data.active_locales,
    timezone: data.timezone,
    first_day_of_week: data.first_day_of_week,
    rtl_support: data.rtl_support,
  });

  const [selected, setSelected] = useState<string | null>(data.default_locale);
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState('');
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const { hasModule } = useEntitlements();
  const { active_locales: active, default_locale: def, timezone } = form.data;
  const timezones = TIMEZONES.includes(timezone) ? TIMEZONES : [timezone, ...TIMEZONES];

  // -------- idiomas --------
  function addLocale(raw: string) {
    if (!hasModule('multilanguage')) return;
    const code = raw.trim().toLowerCase();
    if (!/^[a-z]{2}$/.test(code) || active.includes(code)) return;
    form.setData('active_locales', [...active, code]);
    setSelected(code);
    setAdding(false);
    setQuery('');
  }

  function removeLocale(code: string) {
    if (code === def) return;
    form.setData('active_locales', active.filter((l) => l !== code));
    if (selected === code) setSelected(null);
  }

  const q = query.trim().toLowerCase();
  const suggestions = useMemo(
    () =>
      COMMON.filter((c) => !active.includes(c)).filter(
        (c) => !q || c.includes(q) || langName(c).toLowerCase().includes(q) || nativeName(c).toLowerCase().includes(q),
      ),
    [active, q],
  );
  const customCode = /^[a-z]{2}$/.test(q) && !COMMON.includes(q) && !active.includes(q) ? q : null;

  // -------- guardar --------
  function submit(e: React.FormEvent) {
    e.preventDefault();
    form.patch(updateLocalization(teamSlug).url, {
      preserveScroll: true,
      onSuccess: () => toast.success('Localization settings saved.'),
    });
  }

  function discard() {
    form.reset();
    form.clearErrors();
    setSelected(data.default_locale);
    setAdding(false);
  }

  const sel = selected && active.includes(selected) ? selected : null;
  const defaultIsRtl = RTL.has(def);
  const localTime = safe(
    () => new Intl.DateTimeFormat(def, { dateStyle: 'full', timeStyle: 'short', timeZone: timezone }).format(now),
    '—',
  );

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        {/* ---------------- Lista de idiomas ---------------- */}
        <SettingsSection
          title="Languages"
          description="Languages your store is available in. The default one loads first."
          actions={
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label={adding ? 'Close' : 'Add language'}
              aria-expanded={adding}
              disabled={!hasModule('multilanguage')}
              title={hasModule('multilanguage') ? undefined : 'Multi-language is not included in your plan'}
              onClick={() => { setAdding((v) => !v); setQuery(''); }}
            >
              {adding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </Button>
          }
        >
          {adding && (
            <div className="space-y-2 rounded-xl border border-border/60 bg-muted/30 p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  autoFocus
                  className="pl-9"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== 'Enter') return;
                    e.preventDefault();
                    addLocale(suggestions[0] ?? customCode ?? '');
                  }}
                  placeholder="Search a language or type a 2-letter code"
                  aria-label="Search languages"
                />
              </div>
              <ul className="max-h-48 space-y-1 overflow-y-auto">
                {suggestions.map((c) => (
                  <li key={c}>
                    <button
                      type="button"
                      onClick={() => addLocale(c)}
                      className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span>{langName(c)} <span className="text-muted-foreground">· {nativeName(c)}</span></span>
                      <span className="text-xs uppercase text-muted-foreground">{c}</span>
                    </button>
                  </li>
                ))}
                {customCode && (
                  <li>
                    <button
                      type="button"
                      onClick={() => addLocale(customCode)}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm hover:bg-muted"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add “<span className="uppercase">{customCode}</span>”
                    </button>
                  </li>
                )}
                {suggestions.length === 0 && !customCode && <li className="px-2.5 py-1.5 text-sm text-muted-foreground">No matches.</li>}
              </ul>
            </div>
          )}

          <ul className="space-y-2">
            {active.map((code) => {
              const isSel = sel === code;
              return (
                <li key={code}>
                  <button
                    type="button"
                    aria-pressed={isSel}
                    onClick={() => setSelected(code)}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      isSel ? 'border-primary/60 bg-primary/5' : 'border-border/60 hover:bg-muted/40',
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn('mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border', isSel ? 'border-primary' : 'border-muted-foreground/40')}
                    >
                      {isSel && <span className="h-2 w-2 rounded-full bg-primary" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                        {langName(code)} <span className="font-normal uppercase text-muted-foreground">({code})</span>
                        {code === def && <Badge>Default</Badge>}
                        {RTL.has(code) && <Badge variant="outline">RTL</Badge>}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{nativeName(code)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
            {active.length === 0 && <li className="text-sm text-muted-foreground">No languages yet. Add the first one with the + button.</li>}
          </ul>
          {form.errors.active_locales && <p className="text-xs text-destructive">{form.errors.active_locales}</p>}
          {form.errors.default_locale && <p className="text-xs text-destructive">{form.errors.default_locale}</p>}
        </SettingsSection>

        {/* ---------------- Detalle + formato regional ---------------- */}
        <div className="space-y-6">
          {sel ? (
            <SettingsSection title={`${langName(sel)} (${sel.toUpperCase()})`} description={nativeName(sel)}>
              <div className="flex flex-wrap gap-2">
                {sel === def ? (
                  <Badge className="gap-1"><Star className="h-3 w-3" /> Default language</Badge>
                ) : (
                  <Button type="button" size="sm" variant="outline" onClick={() => form.setData('default_locale', sel)}>
                    <Star className="mr-1.5 h-3.5 w-3.5" /> Set as default
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={sel === def}
                  title={sel === def ? 'Choose another default language first.' : undefined}
                  onClick={() => removeLocale(sel)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Remove
                </Button>
              </div>

              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-lg border border-border/60 p-3">
                  <dt className="text-xs text-muted-foreground">Direction</dt>
                  <dd className="font-medium">{RTL.has(sel) ? 'Right to left' : 'Left to right'}</dd>
                </div>
                <div className="rounded-lg border border-border/60 p-3">
                  <dt className="text-xs text-muted-foreground">Date</dt>
                  <dd className="font-medium">{safe(() => new Intl.DateTimeFormat(sel, { dateStyle: 'long' }).format(now), '—')}</dd>
                </div>
                <div className="rounded-lg border border-border/60 p-3 sm:col-span-2">
                  <dt className="text-xs text-muted-foreground">Number & currency</dt>
                  <dd className="font-medium">
                    {safe(() => new Intl.NumberFormat(sel).format(1234567.89), '—')} ·{' '}
                    {safe(() => new Intl.NumberFormat(sel, { style: 'currency', currency: 'USD' }).format(1234.5), '—')}
                  </dd>
                </div>
              </dl>
            </SettingsSection>
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border/60 px-6 py-12 text-center">
              <Globe className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm font-medium">No language selected</p>
              <p className="text-sm text-muted-foreground">Select a language to see its details and make it the default.</p>
            </div>
          )}

          <SettingsSection title="Regional format" description="Applies to dates, times and the calendar across the admin and the storefront.">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tz">Timezone</Label>
                <Select value={timezone} onValueChange={(v) => form.setData('timezone', v)}>
                  <SelectTrigger id="tz"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {timezones.map((z) => <SelectItem key={z} value={z}>{z.replace(/_/g, ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
                {form.errors.timezone && <p className="text-xs text-destructive">{form.errors.timezone}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="fdow">First day of week</Label>
                <Select value={String(form.data.first_day_of_week)} onValueChange={(v) => form.setData('first_day_of_week', Number(v))}>
                  <SelectTrigger id="fdow"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {WEEKDAYS.map((day, i) => <SelectItem key={day} value={String(i)}>{day}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Local time now: <span className="font-medium text-foreground">{localTime}</span></p>

            <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 p-4">
              <div>
                <p className="text-sm font-medium">Right-to-left (RTL) support</p>
                <p className="text-sm text-muted-foreground">Mirrors the admin and public layouts for RTL locales.</p>
                {defaultIsRtl && !form.data.rtl_support && (
                  <button type="button" onClick={() => form.setData('rtl_support', true)} className="mt-1 text-xs font-medium text-primary hover:underline">
                    Your default language is written right-to-left. Turn RTL on.
                  </button>
                )}
              </div>
              <Switch checked={form.data.rtl_support} onCheckedChange={(v) => form.setData('rtl_support', v)} aria-label="RTL support" />
            </div>
          </SettingsSection>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        {form.isDirty && <span className="mr-auto text-sm text-muted-foreground">You have unsaved changes.</span>}
        <Button type="button" variant="ghost" onClick={discard} disabled={!form.isDirty || form.processing}>Discard</Button>
        <Button type="submit" disabled={!form.isDirty || form.processing} aria-busy={form.processing} className="min-w-36">
          {form.processing ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</>) : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}