import { updateSecurity } from '@/actions/App/Http/Controllers/Admin/SettingController';
import { SettingsSection } from '@/components/settings/settings-section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { SecuritySettings } from '@/types/settings';
import { useForm, usePage } from '@inertiajs/react';
import { Loader2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

/**
 * Política de seguridad del WORKSPACE (aplica a todos los usuarios).
 * La seguridad de la cuenta personal (contraseña, 2FA, passkeys, dispositivos)
 * vive en /settings/security y no se repite aquí.
 */
export default function SecurityTab({ data }: { data: SecuritySettings }) {
  const { currentTeam } = usePage().props as { currentTeam?: { slug: string } };
  const teamSlug = currentTeam!.slug;
  const [newOrigin, setNewOrigin] = useState('');

  const form = useForm({
    cors_allowed_origins: data.cors_allowed_origins ?? [],
    password_min_length: data.password_min_length ?? 12,
    password_require_uppercase: data.password_require_uppercase ?? true,
    password_require_number: data.password_require_number ?? true,
    password_require_symbol: data.password_require_symbol ?? false,
    two_factor_enabled: data.two_factor_enabled ?? false,
    session_lifetime_minutes: data.session_lifetime_minutes ?? 120,
    trusted_proxies: data.trusted_proxies ?? '',
    rate_limit_per_minute: data.rate_limit_per_minute ?? 60,
  });
  const errors = form.errors as Record<string, string | undefined>;

  function addOrigin() {
    const origin = newOrigin.trim().replace(/\/+$/, '');
    if (!origin || form.data.cors_allowed_origins.includes(origin)) return;
    form.setData('cors_allowed_origins', [...form.data.cors_allowed_origins, origin]);
    setNewOrigin('');
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    form.patch(updateSecurity(teamSlug).url, {
      preserveScroll: true,
      onSuccess: () => toast.success('Security policy saved.'),
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <SettingsSection title="CORS" description="Domains allowed to call the API from the browser.">
        <div className="flex flex-wrap items-center gap-2">
          {form.data.cors_allowed_origins.length === 0 && (
            <span className="text-sm text-muted-foreground">No origins allowed yet.</span>
          )}
          {form.data.cors_allowed_origins.map((origin) => (
            <Badge key={origin} variant="secondary" className="gap-1">
              {origin}
              <button
                type="button"
                aria-label={`Remove ${origin}`}
                onClick={() =>
                  form.setData('cors_allowed_origins', form.data.cors_allowed_origins.filter((o) => o !== origin))
                }
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            className="max-w-sm"
            placeholder="https://app.example.com"
            value={newOrigin}
            onChange={(e) => setNewOrigin(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addOrigin();
              }
            }}
            aria-label="New allowed origin"
          />
          <Button type="button" variant="outline" onClick={addOrigin} disabled={!newOrigin.trim()}>
            Add
          </Button>
        </div>
        {errors.cors_allowed_origins && <p className="text-xs text-destructive">{errors.cors_allowed_origins}</p>}
      </SettingsSection>

      <SettingsSection title="Password policy" description="Rules applied whenever someone sets or changes a password.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pw-min">Minimum length</Label>
            <Input
              id="pw-min"
              type="number"
              min={6}
              value={form.data.password_min_length}
              onChange={(e) => form.setData('password_min_length', Number(e.target.value))}
            />
            {errors.password_min_length && <p className="text-xs text-destructive">{errors.password_min_length}</p>}
          </div>
        </div>
        <div className="space-y-3 pt-2">
          <ToggleRow
            label="Require uppercase letter"
            checked={form.data.password_require_uppercase}
            onChange={(v) => form.setData('password_require_uppercase', v)}
          />
          <ToggleRow
            label="Require a number"
            checked={form.data.password_require_number}
            onChange={(v) => form.setData('password_require_number', v)}
          />
          <ToggleRow
            label="Require a symbol"
            checked={form.data.password_require_symbol}
            onChange={(v) => form.setData('password_require_symbol', v)}
          />
        </div>
      </SettingsSection>

      <SettingsSection title="Authentication" description="Session and access rules for the whole workspace.">
        <ToggleRow
          label="Require two-step verification for all admins"
          hint="Admins without an authenticator app will be asked to set one up."
          checked={form.data.two_factor_enabled}
          onChange={(v) => form.setData('two_factor_enabled', v)}
        />

        <div className="grid gap-4 pt-2 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="session-life">Session lifetime (minutes)</Label>
            <Input
              id="session-life"
              type="number"
              min={1}
              value={form.data.session_lifetime_minutes}
              onChange={(e) => form.setData('session_lifetime_minutes', Number(e.target.value))}
            />
            {errors.session_lifetime_minutes && <p className="text-xs text-destructive">{errors.session_lifetime_minutes}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="rate-limit">Rate limit (requests/min)</Label>
            <Input
              id="rate-limit"
              type="number"
              min={1}
              value={form.data.rate_limit_per_minute}
              onChange={(e) => form.setData('rate_limit_per_minute', Number(e.target.value))}
            />
            {errors.rate_limit_per_minute && <p className="text-xs text-destructive">{errors.rate_limit_per_minute}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="proxies">Trusted proxies</Label>
          <Input
            id="proxies"
            value={form.data.trusted_proxies}
            onChange={(e) => form.setData('trusted_proxies', e.target.value)}
            placeholder="* or comma-separated IPs"
          />
          {errors.trusted_proxies && <p className="text-xs text-destructive">{errors.trusted_proxies}</p>}
        </div>
      </SettingsSection>

      <div className="flex items-center justify-end gap-3">
        {form.isDirty && <span className="mr-auto text-sm text-muted-foreground">You have unsaved changes.</span>}
        <Button type="button" variant="ghost" onClick={() => form.reset()} disabled={!form.isDirty || form.processing}>
          Discard
        </Button>
        <Button type="submit" disabled={!form.isDirty || form.processing} aria-busy={form.processing} className="min-w-36">
          {form.processing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
            </>
          ) : (
            'Save changes'
          )}
        </Button>
      </div>
    </form>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 p-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}