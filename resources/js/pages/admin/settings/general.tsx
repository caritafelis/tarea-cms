import SettingController from '@/actions/App/Http/Controllers/Admin/SettingController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { GeneralSettings } from '@/types/settings';
import { Form, usePage } from '@inertiajs/react';
import { Check, Clock, Globe, ImageIcon, Languages, Loader2, Upload, Wrench, X, type LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

/* ------------------------------ helpers ------------------------------ */

function safe<T>(fn: () => T | undefined, fallback: T): T {
  try {
    return fn() ?? fallback;
  } catch {
    return fallback;
  }
}

const LANGS = ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'sv', 'pl', 'tr', 'ru', 'uk', 'ar', 'he', 'fa', 'hi', 'zh', 'ja', 'ko', 'id', 'vi', 'th'];
const langName = (code: string) => safe(() => new Intl.DisplayNames(['en'], { type: 'language' }).of(code), code);

const TIMEZONES: { value: string; label: string; offset?: number }[] = (() => {
  const list = safe(() => (Intl as unknown as { supportedValuesOf: (k: string) => string[] }).supportedValuesOf('timeZone'), [
    'America/Guayaquil', 'America/New_York', 'America/Mexico_City', 'Europe/Madrid', 'Europe/London', 'Asia/Tokyo',
  ]);

  const zones = ['UTC', ...list.filter((z) => z !== 'UTC')];
  const now = new Date();

  return zones.map((zone) => {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: zone,
        timeZoneName: 'shortOffset',
      });

      const parts = formatter.formatToParts(now);
      const tzNamePart = parts.find((p) => p.type === 'timeZoneName');
      const offsetString = tzNamePart ? tzNamePart.value : 'GMT';

      return {
        value: zone,
        label: `${offsetString.replace('GMT', 'UTC')} - ${zone}`,
        offset: 0, // Mabalin nga ikabil ti kalkulado nga offset no kasapulam
      };
    } catch {
      return {
        value: zone,
        label: zone,
        offset: 0,
      };
    }
  });
})();

const DATE_PRESETS = ['Y-m-d', 'd/m/Y', 'm/d/Y', 'd M Y', 'F j, Y', 'j F Y'];
const TIME_PRESETS = ['H:i', 'h:i A', 'g:i a'];

/** Vista previa de un formato estilo PHP (los tokens más usados). */
function phpFormat(fmt: unknown, d: Date): string {
  const format = typeof fmt === 'string' && fmt.trim() !== '' ? fmt : 'Y-m-d';

  const p = (n: number) => String(n).padStart(2, '0');
  const h12 = d.getHours() % 12 || 12;

  const en = (options: Intl.DateTimeFormatOptions) =>
    d.toLocaleString('en-US', options);

  const map: Record<string, string> = {
    Y: String(d.getFullYear()),
    y: String(d.getFullYear()).slice(-2),

    m: p(d.getMonth() + 1),
    n: String(d.getMonth() + 1),

    d: p(d.getDate()),
    j: String(d.getDate()),

    F: en({ month: 'long' }),
    M: en({ month: 'short' }),

    D: en({ weekday: 'short' }),
    l: en({ weekday: 'long' }),

    H: p(d.getHours()),
    G: String(d.getHours()),

    h: p(h12),
    g: String(h12),

    i: p(d.getMinutes()),
    s: p(d.getSeconds()),

    A: d.getHours() < 12 ? 'AM' : 'PM',
    a: d.getHours() < 12 ? 'am' : 'pm',
  };

  return Array.from(format)
    .map((char) => map[char] ?? char)
    .join('');
}

/** Opciones del select: presets + el valor actual si no es un preset. */
const withCurrent = (presets: string[], current: string) => (current && !presets.includes(current) ? [current, ...presets] : presets);

/* ------------------------------ UI pieces ------------------------------ */

const TONES = {
  green: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  blue: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  violet: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
  amber: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
} as const;

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

/** Fila con ícono en baldosa de color, texto y control a la derecha. */
function FeatureRow({
  icon: Icon,
  tone,
  title,
  description,
  control,
  children,
}: {
  icon: LucideIcon;
  tone: keyof typeof TONES;
  title: string;
  description: React.ReactNode;
  control?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-4">
        <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', TONES[tone])}>
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
        {control && <div className="shrink-0 self-center">{control}</div>}
      </div>
      {children && <div className="pl-14">{children}</div>}
    </div>
  );
}

function Field({ label, description, htmlFor, error, children }: { label: string; description?: string; htmlFor: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={htmlFor} className="text-sm font-semibold">{label}</Label>
      {description && <p className="-mt-0.5 text-sm text-muted-foreground">{description}</p>}
      {children}
      <InputError message={error} />
    </div>
  );
}

/** Subida de imagen con vista previa inmediata (el archivo viaja en el mismo formulario). */
function ImagePicker({
  name,
  title,
  description,
  current,
  error,
  round,
  size,
}: {
  name: string;
  title: string;
  description: string;
  current?: string | null;
  error?: string;
  round?: boolean;
  size: 'lg' | 'sm';
}) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function pick(file?: File) {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setFileName(file.name);
  }

  function clear() {
    if (input.current) input.current.value = '';
    setPreview(null);
    setFileName(null);
  }

  const src = preview ?? (current ? `/storage/${current}` : null);

  return (
    <div className="flex items-center gap-5">
      <div
        className={cn(
          'flex shrink-0 items-center justify-center overflow-hidden border border-border bg-muted/40',
          size === 'lg' ? 'size-[88px]' : 'size-14',
          round ? 'rounded-full' : size === 'lg' ? 'rounded-2xl' : 'rounded-xl',
        )}
      >
        {src ? <img src={src} alt="" className="size-full object-cover" /> : <ImageIcon className="size-6 text-muted-foreground" />}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input ref={input} id={name} name={name} type="file" accept="image/*" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
          <Button type="button" size="sm" variant="outline" onClick={() => input.current?.click()}>
            <Upload className="mr-1.5 size-3.5" /> {src ? 'Replace' : 'Upload'}
          </Button>
          {fileName && (
            <>
              <span className="max-w-48 truncate text-xs text-muted-foreground">{fileName} · not saved yet</span>
              <Button type="button" size="icon" variant="ghost" className="size-7" aria-label="Discard selected file" onClick={clear}>
                <X className="size-3.5" />
              </Button>
            </>
          )}
        </div>
        <InputError className="mt-2" message={error} />
      </div>
    </div>
  );
}

/* -------------------------------- tab -------------------------------- */

export default function GeneralTab({ data }: { data: GeneralSettings }) {
  const { currentTeam } = usePage().props as { currentTeam?: { slug: string } };
  const teamSlug = currentTeam!.slug;

  const [maintenance, setMaintenance] = useState(Boolean(data.maintenance_mode));
  const [language, setLanguage] = useState(
    typeof data.default_language === 'string' && data.default_language.trim() !== ''
      ? data.default_language
      : 'en',
  );
  const [timezone, setTimezone] = useState(
    typeof data.default_timezone === 'string' && data.default_timezone.trim() !== ''
      ? data.default_timezone
      : 'UTC',
  );
  const [dateFormat, setDateFormat] = useState(
    typeof data.date_format === 'string' && data.date_format.trim() !== ''
      ? data.date_format
      : 'Y-m-d',
  );

  const [timeFormat, setTimeFormat] = useState(
    typeof data.time_format === 'string' && data.time_format.trim() !== ''
      ? data.time_format
      : 'H:i',
  );
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const languages = LANGS.includes(language) ? LANGS : [language, ...LANGS];
  const preview = `${phpFormat(dateFormat, now)} · ${phpFormat(timeFormat, now)}`;

  return (
    <div className="space-y-8">
      <Form
        action={SettingController.updateGeneral(teamSlug).url}
        method="patch"
        options={{ preserveScroll: true }}
        onSuccess={() => toast.success('General settings saved.')}
        encType="multipart/form-data"
        className="space-y-10"
      >
        {({ processing, errors, recentlySuccessful }) => (
          <>
            {/* ---------------- Site profile ---------------- */}
            <Section title="Site profile">
              {/* Fila horizontal para los selectores de imagen (Logo y Favicon) */}
              <div className="grid gap-6 sm:grid-cols-2 items-start">
                <ImagePicker
                  name="logo"
                  title="Site logo"
                  description="Use a photo or logo rather than text. Square or round images work best."
                  current={data.logo}
                  error={errors.logo}
                  round
                  size="lg"
                />
                <ImagePicker
                  name="favicon"
                  title="Favicon"
                  description="Shown in browser tabs. Use a square image, 64×64 px or larger."
                  current={data.favicon}
                  error={errors.favicon}
                  size="sm"
                />
              </div>
              <div className='grid grid-cols-2 gap-5'>

                {/* Site name */}
                <Field
                  label="Site name"
                  description="How your site’s name will appear to visitors."
                  htmlFor="name"
                  error={errors.name}
                >
                  <Input id="name" name="name" defaultValue={data.name} required />
                </Field>

                {/* Homepage (Ajustado sin grid innecesario si está solo, o preparado por si quieres poner algo al lado) */}
                <Field
                  label="Homepage"
                  description="Path visitors land on."
                  htmlFor="homepage"
                  error={errors.homepage}
                >
                  <Input id="homepage" name="homepage" defaultValue={data.homepage ?? ''} placeholder="/" />
                </Field>
              </div>

              {/* Site description */}
              <Field
                label="Site description"
                description="A short summary used across the site and in search results."
                htmlFor="description"
                error={errors.description}
              >
                <Textarea id="description" name="description" rows={3} defaultValue={data.description ?? ''} />
              </Field>
            </Section>

            <hr className="border-border/60" />

            {/* ---------------- Formatting ---------------- */}
            <Section title="Regional defaults" description="Language, timezone and how dates and times display by default.">
              <FeatureRow
                icon={Languages}
                tone="blue"
                title="Default language"
                description="The language the site loads in first."
                control={
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="w-48" aria-label="Default language"><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      {languages.map((c) => (
                        <SelectItem key={c} value={c}>{langName(c)} ({c})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                }
              />
              <input type="hidden" name="default_language" value={language} />
              <InputError message={errors.default_language} />

              <FeatureRow
                icon={Globe}
                tone="green"
                title="Default timezone"
                description="Used to display dates and schedule publishing."
                control={
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger className="w-64" aria-label="Default timezone"><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                }
              />
              <input type="hidden" name="default_timezone" value={timezone} />
              <InputError message={errors.default_timezone} />

              <FeatureRow
                icon={Clock}
                tone="violet"
                title="Date and time format"
                description={
                  <>
                    Preview: <span className="font-medium text-foreground">{preview}</span>
                  </>
                }
                control={
                  <div className="flex items-center gap-3">
                    {/* Campo de Fecha */}
                    <div className="grid gap-1">
                      <Select value={dateFormat} onValueChange={setDateFormat}>
                        <SelectTrigger id="date-format-select" aria-label="Date format" className="w-full">
                          <SelectValue placeholder="Date format" />
                        </SelectTrigger>
                        <SelectContent>
                          {withCurrent(DATE_PRESETS, dateFormat).map((f) => (
                            <SelectItem key={f} value={f}>
                              <div className="flex items-center justify-between gap-4 w-full">
                                <span>{phpFormat(f, now)}</span>
                                <span className="text-xs text-muted-foreground font-mono">{f}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <InputError message={errors.date_format} />
                    </div>

                    {/* Campo de Hora */}
                    <div className="grid gap-1">
                      <Select value={timeFormat} onValueChange={setTimeFormat}>
                        <SelectTrigger id="time-format-select" aria-label="Time format" className="w-full">
                          <SelectValue placeholder="Time format" />
                        </SelectTrigger>
                        <SelectContent>
                          {withCurrent(TIME_PRESETS, timeFormat).map((f) => (
                            <SelectItem key={f} value={f}>
                              <div className="flex items-center justify-between gap-4 w-full">
                                <span>{phpFormat(f, now)}</span>
                                <span className="text-xs text-muted-foreground font-mono">{f}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <InputError message={errors.time_format} />
                    </div>
                  </div>
                }
              />
              <input type="hidden" name="date_format" value={dateFormat} />
              <input type="hidden" name="time_format" value={timeFormat} />
            </Section>

            <hr className="border-border/60" />

            {/* ---------------- Availability ---------------- */}
            <Section title="Availability">
              <FeatureRow
                icon={Wrench}
                tone="amber"
                title="Maintenance mode"
                description={
                  maintenance
                    ? 'The public site is offline. Visitors see a maintenance page; the admin stays accessible.'
                    : 'Take the public site offline while you make changes. The admin stays accessible.'
                }
                control={<Switch checked={maintenance} onCheckedChange={setMaintenance} aria-label="Maintenance mode" />}
              />
              <input type="hidden" name="maintenance_mode" value={maintenance ? '1' : '0'} />
              <InputError message={errors.maintenance_mode} />
            </Section>

            {/* ---------------- Save ---------------- */}
            <div className="flex items-center justify-end gap-3 border-t border-border/60 pt-5">
              {recentlySuccessful && (
                <span className="mr-auto flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
                  <Check className="size-4" /> Saved
                </span>
              )}
              <Button type="submit" disabled={processing} aria-busy={processing} className="min-w-36">
                {processing ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" /> Saving…
                  </>
                ) : (
                  'Save changes'
                )}
              </Button>
            </div>
          </>
        )}
      </Form>
    </div>
  );
}