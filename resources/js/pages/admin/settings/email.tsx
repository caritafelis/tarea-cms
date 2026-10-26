import { sendTestEmail, updateEmail } from '@/actions/App/Http/Controllers/Admin/SettingController';
import Heading from '@/components/heading';
import { ProviderLogo } from '@/components/settings/provider-logo';
import { FeatureRow, Field, Section } from '@/components/settings/settings-primitives';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { EmailSettings } from '@/types/settings';
import { router, useForm, usePage } from '@inertiajs/react';
import { AlertCircle, Check, CheckCircle2, Eye, EyeOff, Loader2, Send } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

/** Input de secretos con botón para mostrar/ocultar. */
function SecretInput({ id, value, placeholder, onChange }: { id: string; value: string; placeholder?: string; onChange: (v: string) => void }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? 'text' : 'password'}
        autoComplete="off"
        className="pr-10"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        aria-label={visible ? 'Hide value' : 'Show value'}
        onClick={() => setVisible((v) => !v)}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

type TestResult = { ok: boolean; message: string } | null;

export default function EmailTab({ data }: { data: EmailSettings }) {
  const { currentTeam } = usePage().props as { currentTeam?: { slug: string } };
  const teamSlug = currentTeam!.slug;

  const providers = data.providers ?? {};
  const providerKeys = Object.keys(providers);

  const form = useForm({
    mailer: data.mailer ?? 'smtp',
    from_name: data.from_name ?? '',
    from_address: data.from_address ?? '',
    credentials: (data.credentials ?? {}) as Record<string, string>,
  });
  const errors = form.errors as Record<string, string | undefined>;
  const activeProvider = providers[form.data.mailer];

  // Credenciales por proveedor: al volver a uno anterior se restauran, no se pierden.
  const cache = useRef<Record<string, Record<string, string>>>({
    [data.mailer ?? 'smtp']: (data.credentials ?? {}) as Record<string, string>,
  });

  const [testEmail, setTestEmail] = useState('');
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult>(null);

  function setCredential(key: string, value: string) {
    form.setData((prev) => ({ ...prev, credentials: { ...prev.credentials, [key]: value } }));
  }

  function changeMailer(mailer: string) {
    if (mailer === form.data.mailer) return;
    cache.current[form.data.mailer] = form.data.credentials;
    form.setData((prev) => ({ ...prev, mailer, credentials: cache.current[mailer] ?? {} }));
  }

  function discard() {
    cache.current = { [data.mailer ?? 'smtp']: (data.credentials ?? {}) as Record<string, string> };
    form.reset();
    form.clearErrors();
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    form.patch(updateEmail(teamSlug).url, {
      preserveScroll: true,
      onSuccess: () => {
        setResult(null);
        toast.success('Email settings saved.');
      },
    });
  }

  function sendTest(e: React.FormEvent) {
    e.preventDefault();
    if (!testEmail || testing) return;

    router.post(sendTestEmail(teamSlug).url, { email: testEmail }, {
      preserveScroll: true,
      onStart: () => {
        setTesting(true);
        setResult(null);
      },
      onFinish: () => setTesting(false),
      // El backend responde con redirect + flash (success/error): el resultado real viene en el flash.
      onSuccess: (page) => {
        const props = page.props as { flash?: { success?: string; error?: string } };
        const error = props.flash?.error;
        setResult(
          error
            ? { ok: false, message: error }
            : { ok: true, message: props.flash?.success ?? `Test email sent to ${testEmail}. Check the inbox.` },
        );
      },
      onError: (errs) => setResult({ ok: false, message: Object.values(errs).join(' ') || 'We couldn’t send the test email.' }),
    });
  }

  return (
    <div className="space-y-10">

      <form onSubmit={submit} className="space-y-10">
        {/* ---------------- Provider ---------------- */}
        <Section title={''} description={''}>
          <div role="radiogroup" aria-label="Email provider" className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {providerKeys.map((key) => {
              const p = providers[key];
              const selected = form.data.mailer === key;

              return (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => changeMailer(key)}
                  className={cn(
                    'flex items-start gap-3 rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    selected ? 'border-primary/60 bg-primary/5' : 'border-border/60 hover:bg-muted/40',
                  )}
                >
                  <ProviderLogo provider={key} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{p.label}</span>
                    {p.description && <span className="mt-0.5 line-clamp-2 block text-sm text-muted-foreground">{p.description}</span>}
                  </span>
                  {selected && <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />}
                </button>
              );
            })}
          </div>
          {providerKeys.length === 0 && <p className="text-sm text-muted-foreground">No email providers available.</p>}
          {errors.mailer && <p className="text-xs text-destructive">{errors.mailer}</p>}
        </Section>

        {/* Campos dinámicos: cada proveedor define los suyos en MailProviderRegistry. */}
        {activeProvider && (
          <>
            <hr className="border-border/60" />

            <Section title={`${activeProvider.label} settings`} description="Credentials and connection details for this provider.">
              {activeProvider.fields.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
                  This provider doesn’t need any credentials.
                </p>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2">
                  {activeProvider.fields.map((field) => {
                    const id = `cred-${field.key}`;
                    const value = form.data.credentials[field.key] ?? '';
                    const error = errors[`credentials.${field.key}`];

                    return (
                      <Field key={field.key} label={field.label} htmlFor={id} error={error}>
                        {field.type === 'select' ? (
                          <Select value={value} onValueChange={(v) => setCredential(field.key, v)}>
                            <SelectTrigger id={id}><SelectValue placeholder={field.label} /></SelectTrigger>
                            <SelectContent>
                              {field.options?.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : field.type === 'password' ? (
                          <SecretInput id={id} value={value} placeholder={field.placeholder} onChange={(v) => setCredential(field.key, v)} />
                        ) : (
                          <Input
                            id={id}
                            type={field.type}
                            placeholder={field.placeholder}
                            value={value}
                            onChange={(e) => setCredential(field.key, e.target.value)}
                          />
                        )}
                      </Field>
                    );
                  })}
                </div>
              )}
            </Section>
          </>
        )}

        <hr className="border-border/60" />

        {/* ---------------- Sender ---------------- */}
        <Section title="Sender identity" description="The name and address recipients will see.">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="From name" htmlFor="from_name" error={errors.from_name}>
              <Input id="from_name" value={form.data.from_name} onChange={(e) => form.setData('from_name', e.target.value)} />
            </Field>
            <Field label="From address" htmlFor="from_address" error={errors.from_address}>
              <Input id="from_address" type="email" value={form.data.from_address} onChange={(e) => form.setData('from_address', e.target.value)} />
            </Field>
          </div>
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

      {/* Fuera del formulario principal: es una acción independiente. */}
      <Section title="Test connection" description="Send a real email to check that your settings work end to end.">
        <FeatureRow
          icon={Send}
          tone="green"
          title="Send a test email"
          description={
            form.isDirty
              ? 'Save your changes first: the test uses the saved settings, not the ones on screen.'
              : 'We’ll send a short message using your saved provider and sender.'
          }
        >
          <form onSubmit={sendTest} className="flex flex-wrap items-center gap-2">
            <Input
              type="email"
              required
              className="w-72 max-w-full"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="you@example.com"
              aria-label="Send a test email to"
            />
            <Button type="submit" variant="outline" disabled={!testEmail || testing || form.isDirty} aria-busy={testing}>
              {testing ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Sending…
                </>
              ) : (
                'Send test email'
              )}
            </Button>
          </form>

          {result && (
            <div
              role="status"
              className={cn(
                'mt-3 flex items-start gap-2 rounded-xl border p-3 text-sm',
                result.ok
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                  : 'border-destructive/30 bg-destructive/10 text-destructive',
              )}
            >
              {result.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> : <AlertCircle className="mt-0.5 size-4 shrink-0" />}
              <span>{result.message}</span>
            </div>
          )}
        </FeatureRow>
      </Section>
    </div>
  );
}