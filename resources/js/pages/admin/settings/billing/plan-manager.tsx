import { SettingsSection } from '@/components/settings/settings-section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { ManageablePlan, PlanFeature } from '@/types';
import { router } from '@inertiajs/react';
import { ChevronDown, ChevronUp, Copy, CreditCard, Info, LayoutGrid, Loader2, Pencil, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { FaApple, FaPaypal } from 'react-icons/fa6';
import { FcGoogle } from 'react-icons/fc';
import { toast } from 'sonner';
import { ConfirmDialog, EmptyState, FeatureIcon, Field, money, normalizeFeatures } from './billing-ui';
import { useBillingBase } from './use-billing-base';

interface PlanSync {
    gateway: 'stripe' | 'paypal' | 'nuvei';
    environment: string;
    status: string;
    external_product_id: string | null;
    external_plan_id: string | null;
    external_price_id: string | null;
    synced_at: string | null;
    last_error: string | null;
}
interface CheckoutMethod { key: string; label: string; active: boolean; detail: string | null }
type PlanX = ManageablePlan & { syncs?: PlanSync[]; checkout_methods?: CheckoutMethod[] };

const GATEWAY_LABEL: Record<string, string> = { stripe: 'Stripe', paypal: 'PayPal', nuvei: 'Nuvei' };
const STATUS_UI: Record<string, { label: string; cls: string }> = {
    synced: { label: 'Synced', cls: 'border-emerald-500/40 text-emerald-600' },
    failed: { label: 'Failed', cls: 'border-destructive/40 text-destructive' },
    syncing: { label: 'Syncing…', cls: 'border-amber-500/40 text-amber-600' },
    pending: { label: 'Pending', cls: 'border-amber-500/40 text-amber-600' },
    unsupported: { label: 'Not supported', cls: 'text-muted-foreground' },
    not_synced: { label: 'Not synced', cls: 'text-muted-foreground' },
};
const METHOD_ICON: Record<string, React.ReactNode> = {
    card: <CreditCard className="h-4 w-4" />,
    paypal: <FaPaypal className="h-4 w-4 text-[#003087]" />,
    apple_pay: <FaApple className="h-4 w-4" />,
    google_pay: <FcGoogle className="h-4 w-4" />,
};

function SyncBadge({ status }: { status: string }) {
    const ui = STATUS_UI[status] ?? STATUS_UI.not_synced;
    return <Badge variant="outline" className={cn('font-normal', ui.cls)}>{ui.label}</Badge>;
}

/** Estado combinado de una familia (mensual + anual) para un gateway. */
function familyStatus(plans: PlanX[], gateway: string): string {
    const list = plans.map((p) => p.syncs?.find((s) => s.gateway === gateway)?.status ?? 'not_synced');
    if (list.length && list.every((s) => s === 'synced')) return 'synced';
    return list.find((s) => s === 'failed') ?? list.find((s) => s !== 'synced') ?? 'not_synced';
}

interface Family {
    key: string;
    name: string;
    monthly?: PlanX;
    yearly?: PlanX;
    all: PlanX[];
    sort_order: number;
    is_active: boolean;
    features: PlanFeature[];
    currency: string;
    subscribers: number;
}

function groupPlans(plans: PlanX[]): Family[] {
    const map = new Map<string, Family>();
    [...plans]
        .sort((a, b) => a.sort_order - b.sort_order)
        .forEach((p) => {
            const key = p.name.trim().toLowerCase();
            const f: Family = map.get(key) ?? {
                key, name: p.name, all: [], sort_order: p.sort_order, is_active: false,
                features: [], currency: p.currency, subscribers: 0,
            };
            f.all.push(p);
            if (p.interval === 'month') f.monthly = p;
            else f.yearly = p;
            f.is_active = f.is_active || p.is_active;
            f.subscribers += p.subscribers_count;
            if (p.interval === 'month' || f.features.length === 0) f.features = normalizeFeatures(p.features);
            map.set(key, f);
        });
    return Array.from(map.values());
}

const slugify = (v: string) =>
    v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const tierFrom = (name: string) => slugify(name.replace(/\s*\+?\s*commerce\s*$/i, '')) || slugify(name);

const discountPct = (monthly: number, yearly: number) =>
    monthly > 0 && yearly > 0 && yearly < monthly * 12 ? Math.round((1 - yearly / (monthly * 12)) * 100) : 0;

interface FormState {
    name: string;
    tier: string;
    currency: string;
    price_month: string;
    price_year: string;
    offer_year: boolean;
    id_month: string;
    id_year: string;
    features: PlanFeature[];
    is_active: boolean;
    has_ecommerce: boolean;
}

const emptyForm: FormState = {
    name: '', tier: '', currency: 'usd', price_month: '', price_year: '', offer_year: true,
    id_month: '', id_year: '', features: [], is_active: true, has_ecommerce: false,
};

type Mode = 'create' | 'edit' | 'clone';
interface Op { method: 'post' | 'patch' | 'delete'; url: string; data?: Record<string, unknown> }

export default function PlanManager({ plans }: { plans: PlanX[] }) {
    const base = useBillingBase();
    const families = useMemo(() => groupPlans(plans), [plans]);
    const nextSort = plans.length ? Math.max(...plans.map((p) => p.sort_order)) + 1 : 0;

    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<Mode>('create');
    const [editingIds, setEditingIds] = useState<number[]>([]);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [newFeature, setNewFeature] = useState('');
    const [toDelete, setToDelete] = useState<Family | null>(null);
    const [tierTouched, setTierTouched] = useState(false);
    const [syncing, setSyncing] = useState(false);

    const editing = mode === 'edit' ? families.find((f) => f.all.some((p) => editingIds.includes(p.id))) : undefined;
    const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((prev) => ({ ...prev, [k]: v }));
    const baseTier = (name: string) => slugify(name.replace(/\s*\+\s*commerce\s*$/i, ''));
    function changeName(v: string) {
        setForm((prev) => ({ ...prev, name: v, tier: tierTouched ? prev.tier : baseTier(v) }));
    }

    function changeTier(v: string) {
        setTierTouched(true);
        // Permite escribir guiones mientras tecleas; se limpia del todo al guardar
        set('tier', v.toLowerCase().replace(/[^a-z0-9-]/g, ''));
    }

    // Si lo deja vacío, vuelve a sincronizarse con el nombre
    function blurTier() {
        if (form.tier.trim()) return;
        setTierTouched(false);
        set('tier', baseTier(form.name));
    }

    function openCreate() {
        setMode('create'); setEditingIds([]); setForm(emptyForm); setTierTouched(false);
        setErrors({}); setNewFeature(''); setOpen(true);
    }

    function formFrom(f: Family, clone: boolean): FormState {
        return {
            name: clone ? `${f.name} copy` : f.name,
            tier: clone ? baseTier(`${f.name} copy`) : f.all[0]?.tier ?? baseTier(f.name),
            has_ecommerce: f.all[0]?.has_ecommerce ?? false,
            currency: f.currency,
            price_month: f.monthly ? String(f.monthly.price) : '',
            price_year: f.yearly ? String(f.yearly.price) : '',
            offer_year: clone ? !!f.yearly : !!f.yearly?.is_active,
            id_month: clone ? '' : f.monthly?.gateway_price_id ?? '',
            id_year: clone ? '' : f.yearly?.gateway_price_id ?? '',
            features: f.features.map((x) => ({ ...x })),
            is_active: clone ? false : f.is_active,
        };
    }

    function openEdit(f: Family) {
        const next = formFrom(f, false);
        setMode('edit'); setEditingIds(f.all.map((p) => p.id)); setForm(next);
        setTierTouched(next.tier !== slugify(next.name));
        setErrors({}); setNewFeature(''); setOpen(true);
    }

    function openClone(f: Family) {
        const next = formFrom(f, true);
        setMode('clone'); setEditingIds([]); setForm(next); setTierTouched(false);
        setErrors({}); setNewFeature(''); setOpen(true);
    }

    const setFeatures = (next: PlanFeature[]) => set('features', next);
    const updateFeature = (i: number, patch: Partial<PlanFeature>) => setFeatures(form.features.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
    const removeFeature = (i: number) => setFeatures(form.features.filter((_, idx) => idx !== i));
    function moveFeature(i: number, dir: -1 | 1) {
        const j = i + dir;
        if (j < 0 || j >= form.features.length) return;
        const next = [...form.features];
        [next[i], next[j]] = [next[j], next[i]];
        setFeatures(next);
    }
    function addFeature() {
        const label = newFeature.trim();
        if (!label) return;
        setFeatures([...form.features, { label, included: true }]);
        setNewFeature('');
    }

    function run(ops: Op[], onDone: () => void, onFail: (i: number, errs: Record<string, string>) => void, i = 0) {
        if (i >= ops.length) return onDone();
        const op = ops[i];
        router.visit(op.url, {
            method: op.method,
            data: op.data as never,
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => run(ops, onDone, onFail, i + 1),
            onError: (errs) => onFail(i, errs as Record<string, string>),
        });
    }

    function save(e: React.FormEvent) {
        e.preventDefault();
        if (processing) return;

        const tier = slugify(form.tier);

        const errs: Record<string, string> = {};
        if (!form.name.trim()) errs.name = 'Enter a plan name.';
        if (!tier) errs.tier = 'Enter a tier key.';
        if (form.price_month === '' || Number(form.price_month) < 0) errs.price_month = 'Enter the monthly price.';
        if (form.offer_year && (form.price_year === '' || Number(form.price_year) < 0)) errs.price_year = 'Enter the yearly price.';
        if (Object.keys(errs).length) return setErrors(errs);

        const features = form.features.map((f) => ({ ...f, label: f.label.trim() })).filter((f) => f.label);
        const slug = slugify(form.name);
        const common = {
            name: form.name.trim(),
            tier,
            has_ecommerce: form.has_ecommerce,
            currency: form.currency.toLowerCase(),
            features,
            sort_order: editing ? editing.sort_order : nextSort,
        };

        const payload = (interval: 'month' | 'year', existing: ManageablePlan | undefined, price: string, gid: string, active: boolean) => ({
            ...common,
            interval,
            slug: existing?.slug ?? (interval === 'month' ? slug : `${slug}-yearly`),
            price,
            gateway: existing?.gateway ?? 'stripe',
            is_active: active,
        });

        const ops: Op[] = [];
        const m = editing?.monthly;
        const y = editing?.yearly;

        ops.push(m
            ? { method: 'patch', url: `${base}/plans/${m.slug}`, data: payload('month', m, form.price_month, form.id_month, form.is_active) }
            : { method: 'post', url: `${base}/plans`, data: payload('month', undefined, form.price_month, form.id_month, form.is_active) });

        if (form.offer_year) {
            ops.push(y
                ? { method: 'patch', url: `${base}/plans/${y.slug}`, data: payload('year', y, form.price_year, form.id_year, form.is_active) }
                : { method: 'post', url: `${base}/plans`, data: payload('year', undefined, form.price_year, form.id_year, form.is_active) });
        } else if (y) {
            ops.push(y.subscribers_count === 0
                ? { method: 'delete', url: `${base}/plans/${y.slug}` }
                : { method: 'patch', url: `${base}/plans/${y.slug}`, data: payload('year', y, String(y.price), form.id_year, false) });
        }

        setProcessing(true);
        setErrors({});
        run(
            ops,
            () => {
                setProcessing(false);
                setOpen(false);
                toast.success(mode === 'edit' ? 'Plan updated.' : mode === 'clone' ? 'Plan duplicated.' : 'Plan created.');
            },
            (i, errs) => {
                setProcessing(false);
                if (i > 0) {
                    setOpen(false);
                    toast.error('The monthly plan was saved, but the yearly one failed. Open the plan to retry.');
                    return;
                }
                setErrors({
                    ...errs,
                    price_month: errs.price ?? '',
                    general: Object.values(errs).join(' '),
                });
            },
        );
    }

    function syncPlans(targets: PlanX[], gateway: string | null) {
        if (syncing || !targets.length) return;
        setSyncing(true);
        run(
            targets.map((p) => ({ method: 'post' as const, url: `${base}/plans/${p.slug}/sync`, data: gateway ? { gateway } : {} })),
            () => { setSyncing(false); toast.success('Synchronization finished. Check each gateway status.'); },
            () => { setSyncing(false); toast.error('Synchronization could not be started.'); },
        );
    }

    function confirmDelete() {
        if (!toDelete) return;
        const f = toDelete;
        setProcessing(true);
        run(
            f.all.map((p) => ({ method: 'delete' as const, url: `${base}/plans/${p.slug}` })),
            () => { setProcessing(false); setToDelete(null); toast.success('Plan deleted.'); },
            () => { setProcessing(false); setToDelete(null); toast.error('We couldn’t delete this plan.'); },
        );
    }

    const methods = (editing?.monthly ?? editing?.yearly)?.checkout_methods;
    const pct = discountPct(Number(form.price_month), Number(form.price_year));
    const title = mode === 'edit' ? `Edit ${editing?.name ?? 'plan'}` : mode === 'clone' ? 'Duplicate plan' : 'New plan';

    return (
        <SettingsSection
            title="Plan management"
            description="Each plan has a monthly price and, optionally, a yearly one. Features are shared."
            actions={<Button size="sm" onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> New plan</Button>}
        >
            {families.length === 0 ? (
                <EmptyState
                    icon={LayoutGrid}
                    title="No plans yet"
                    description="Create your first plan to start accepting subscriptions."
                    action={<Button size="sm" onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> New plan</Button>}
                />
            ) : (
                <ul className="divide-y divide-border/60 rounded-xl border border-border/60">
                    {families.map((f) => {
                        const yp = f.yearly ? discountPct(f.monthly?.price ?? 0, f.yearly.price) : 0;
                        return (
                            <li key={f.key} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0 space-y-1">
                                    <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                                        {f.name}
                                        {!f.is_active && <Badge variant="secondary">Inactive</Badge>}
                                    </p>
                                    <p className="flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
                                        <span>{f.monthly ? `${money(f.monthly.price, f.monthly.currency)} / month` : 'No monthly price'}</span>
                                        <span>
                                            {f.yearly ? `${money(f.yearly.price, f.yearly.currency)} / year${yp > 0 ? ` (-${yp}%)` : ''}` : 'No yearly price'}
                                        </span>
                                        <span>{f.subscribers} subscriber{f.subscribers === 1 ? '' : 's'}</span>
                                    </p>
                                    <p className="flex flex-wrap gap-x-3 gap-y-1 pt-1 text-xs text-muted-foreground">
                                        {(['stripe', 'paypal', 'nuvei'] as const).map((g) => (
                                            <span key={g} className="inline-flex items-center gap-1.5">
                                                {GATEWAY_LABEL[g]} <SyncBadge status={familyStatus(f.all, g)} />
                                            </span>
                                        ))}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" disabled={syncing} onClick={() => syncPlans(f.all, null)} title="Create or update this plan in Stripe and PayPal">
                                        <RefreshCw className={cn('mr-1.5 h-3.5 w-3.5', syncing && 'animate-spin')} /> Sync
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => openEdit(f)}>
                                        <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => openClone(f)} title="Create a copy to add or enable more features">
                                        <Copy className="mr-1.5 h-3.5 w-3.5" /> Duplicate
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        aria-label={`Delete ${f.name}`}
                                        disabled={f.subscribers > 0}
                                        title={f.subscribers > 0 ? 'Plans with subscribers can’t be deleted. Deactivate it instead.' : 'Delete plan'}
                                        onClick={() => setToDelete(f)}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}

            <Dialog open={open} onOpenChange={(v) => !processing && setOpen(v)}>
                <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl no-scrollbar">
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                        <DialogDescription>One plan, two billing options. Customers pick monthly or yearly when they subscribe.</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={save}>
                        <fieldset disabled={processing} className="m-0 min-w-0 space-y-6 border-0 p-0 transition-opacity disabled:opacity-70">
                            {mode === 'clone' && (
                                <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/30 p-3 text-sm text-muted-foreground">
                                    <Info className="mt-0.5 h-4 w-4 shrink-0" />
                                    <p>Features were copied. Add or enable new ones without losing the originals. The copy starts inactive and is synchronized with the gateways when you create it.</p>
                                </div>
                            )}

                            {errors.general && (
                                <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{errors.general}</p>
                            )}

                            {/* Datos básicos */}
                            <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
                                <Field label="Plan name" htmlFor="plan-name" error={errors.name}>
                                    <Input id="plan-name" value={form.name} onChange={(e) => changeName(e.target.value)} placeholder="Professional" autoFocus />
                                </Field>
                                <Field label="Currency" htmlFor="plan-currency">
                                    <Input id="plan-currency" maxLength={3} className="uppercase" value={form.currency} onChange={(e) => set('currency', e.target.value.toLowerCase())} />
                                </Field>
                            </div>

                            <Field label="Tier" htmlFor="plan-tier" error={errors.tier}>
                                <Input
                                    id="plan-tier"
                                    value={form.tier}
                                    onChange={(e) => changeTier(e.target.value)}
                                    onBlur={blurTier}
                                    placeholder="professional"
                                    className="font-mono"
                                />
                                <p className="mt-1.5 text-xs text-muted-foreground">
                                    Follows the plan name unless you edit it. Plans with and without online store that share a tier are treated as the same level.
                                </p>
                            </Field>
                            <div className="flex items-center justify-between rounded-xl border border-border/60 p-4">
                                <div>
                                    <p className="text-sm font-medium">Includes online store</p>
                                    <p className="text-xs text-muted-foreground">Shown when customers enable the online store during onboarding.</p>
                                </div>
                                <Switch
                                    checked={form.has_ecommerce}
                                    onCheckedChange={(v) => set('has_ecommerce', v)}
                                    aria-label="Includes online store"
                                />
                            </div>

                            {/* Precios */}
                            <section className="space-y-3">
                                <p className="text-sm font-medium">Pricing</p>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="space-y-2 rounded-xl border border-border/60 p-4">
                                        <label htmlFor="price-month" className="text-sm font-medium">Monthly</label>
                                        <div className="relative">
                                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium uppercase text-muted-foreground">{form.currency}</span>
                                            <Input id="price-month" type="number" step="0.01" min="0" inputMode="decimal" className="pl-12" value={form.price_month} onChange={(e) => set('price_month', e.target.value)} placeholder="0.00" />
                                        </div>
                                        {errors.price_month && <p className="text-xs text-destructive">{errors.price_month}</p>}
                                        <p className="text-xs text-muted-foreground">Billed every month.</p>
                                    </div>

                                    <div className={cn('space-y-2 rounded-xl border p-4 transition-colors', form.offer_year ? 'border-border/60' : 'border-dashed border-border/60 bg-muted/20')}>
                                        <div className="flex items-center justify-between">
                                            <label htmlFor="price-year" className="text-sm font-medium">Yearly</label>
                                            <Switch checked={form.offer_year} onCheckedChange={(v) => set('offer_year', v)} aria-label="Offer yearly billing" />
                                        </div>
                                        <div className="relative">
                                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium uppercase text-muted-foreground">{form.currency}</span>
                                            <Input id="price-year" type="number" step="0.01" min="0" inputMode="decimal" className="pl-12" disabled={!form.offer_year} value={form.price_year} onChange={(e) => set('price_year', e.target.value)} placeholder="0.00" />
                                        </div>
                                        {errors.price_year && <p className="text-xs text-destructive">{errors.price_year}</p>}
                                        {form.offer_year ? (
                                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                                                <span>{pct > 0 ? `Saves ${pct}% vs monthly` : 'Billed once a year.'}</span>
                                                <button
                                                    type="button"
                                                    disabled={!Number(form.price_month)}
                                                    onClick={() => set('price_year', (Number(form.price_month) * 12 * 0.8).toFixed(2))}
                                                    className="font-medium text-primary hover:underline disabled:opacity-40"
                                                >
                                                    Apply 20% off
                                                </button>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-muted-foreground">Off: customers only see the monthly price.</p>
                                        )}
                                    </div>
                                </div>
                            </section>

                            {/* Métodos de pago */}
                            <section className="space-y-2">
                                <p className="text-sm font-medium">Payment methods</p>
                                {methods ? (
                                    <>
                                        <div className="flex flex-wrap gap-2">
                                            {methods.map((m) => (
                                                <span
                                                    key={m.key}
                                                    title={m.detail ?? undefined}
                                                    className={cn(
                                                        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs',
                                                        m.active ? 'border-emerald-500/40' : 'border-border/60 text-muted-foreground line-through opacity-60',
                                                    )}
                                                >
                                                    {METHOD_ICON[m.key]} {m.label}
                                                </span>
                                            ))}
                                        </div>
                                        <ul className="space-y-0.5 text-xs text-muted-foreground">
                                            {methods.filter((m) => m.detail).map((m) => (
                                                <li key={m.key}><span className="font-medium">{m.label}:</span> {m.detail}</li>
                                            ))}
                                        </ul>
                                    </>
                                ) : (
                                    <p className="text-xs text-muted-foreground">Available methods are shown once the plan is saved and synchronized.</p>
                                )}
                            </section>

                            {/* Features */}
                            <section className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium">Features</p>
                                    <span className="text-xs text-muted-foreground">{form.features.filter((f) => f.included).length} included</span>
                                </div>

                                <ul className="space-y-1.5">
                                    {form.features.length === 0 && <li className="text-sm text-muted-foreground">No features yet. Add the first one below.</li>}
                                    {form.features.map((f, i) => (
                                        <li key={i} className="flex items-center gap-1.5 rounded-lg border border-border/60 py-1 pl-2.5 pr-1.5">
                                            <FeatureIcon label={f.label} className={cn('h-4 w-4 shrink-0', f.included ? 'text-primary' : 'text-muted-foreground')} />
                                            <Input
                                                aria-label={`Feature ${i + 1}`}
                                                value={f.label}
                                                onChange={(e) => updateFeature(i, { label: e.target.value })}
                                                className={cn('h-8 flex-1 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0', !f.included && 'text-muted-foreground')}
                                            />
                                            <Switch checked={f.included} onCheckedChange={(v) => updateFeature(i, { included: v })} aria-label={f.included ? 'Included' : 'Not included'} />
                                            <div className="flex flex-col">
                                                <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => moveFeature(i, -1)} className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronUp className="h-3.5 w-3.5" /></button>
                                                <button type="button" aria-label="Move down" disabled={i === form.features.length - 1} onClick={() => moveFeature(i, 1)} className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronDown className="h-3.5 w-3.5" /></button>
                                            </div>
                                            <Button type="button" size="icon" variant="ghost" className="h-8 w-8" aria-label="Remove feature" onClick={() => removeFeature(i)}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </li>
                                    ))}
                                </ul>

                                <div className="flex gap-2">
                                    <Input
                                        value={newFeature}
                                        onChange={(e) => setNewFeature(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); } }}
                                        placeholder="Add a feature and press Enter"
                                        aria-label="New feature"
                                    />
                                    <Button type="button" variant="outline" onClick={addFeature} disabled={!newFeature.trim()}>
                                        <Plus className="mr-1.5 h-4 w-4" /> Add
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">Use the same wording on every plan so customers can compare. Switch off a feature to show it as not included.</p>
                            </section>

                            {/* Gateways */}
                            {mode === 'edit' && editing && (
                                <section className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium">Payment gateways</p>
                                        <Button type="button" size="sm" variant="outline" disabled={syncing} onClick={() => syncPlans(editing.all, null)}>
                                            <RefreshCw className={cn('mr-1.5 h-3.5 w-3.5', syncing && 'animate-spin')} /> Sync all
                                        </Button>
                                    </div>

                                    {([['Monthly', editing.monthly], ['Yearly', editing.yearly]] as const)
                                        .filter(([, plan]) => !!plan)
                                        .map(([label, plan]) => (
                                            <div key={label} className="space-y-2 rounded-xl border border-border/60 p-3">
                                                <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
                                                {(plan!.syncs ?? []).map((s) => {
                                                    const ids: [string, string | null][] = s.gateway === 'stripe'
                                                        ? [['Product', s.external_product_id], ['Price', s.external_price_id]]
                                                        : s.gateway === 'paypal'
                                                            ? [['Product', s.external_product_id], ['Plan', s.external_plan_id]]
                                                            : [];
                                                    return (
                                                        <div key={s.gateway} className="space-y-1 border-t border-border/40 pt-2 first:border-0 first:pt-0">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <span className="flex items-center gap-2 text-sm font-medium">
                                                                    {GATEWAY_LABEL[s.gateway]} <SyncBadge status={s.status} />
                                                                    <span className="text-xs font-normal text-muted-foreground">{s.environment}</span>
                                                                </span>
                                                                <Button
                                                                    type="button" size="sm" variant="ghost"
                                                                    disabled={syncing || s.gateway === 'nuvei'}
                                                                    title={s.gateway === 'nuvei' ? 'Nuvei has no automatic recurring plans' : `Sync with ${GATEWAY_LABEL[s.gateway]}`}
                                                                    onClick={() => syncPlans([plan!], s.gateway)}
                                                                >
                                                                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Sync
                                                                </Button>
                                                            </div>
                                                            {ids.map(([k, v]) => (
                                                                <p key={k} className="flex gap-2 text-xs text-muted-foreground">
                                                                    <span className="w-14 shrink-0">{k}</span>
                                                                    <code className="break-all font-mono text-foreground/80">{v ?? '—'}</code>
                                                                </p>
                                                            ))}
                                                            {s.synced_at && <p className="text-xs text-muted-foreground">Last sync: {s.synced_at}</p>}
                                                            {s.last_error && <p className="break-words text-xs text-destructive">{s.last_error}</p>}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ))}
                                    <p className="text-xs text-muted-foreground">Created automatically when you save. Syncing never duplicates: existing products are reused and a new price is only created when the amount, currency or interval changes.</p>
                                </section>
                            )}

                            {/* Estado */}
                            <div className="flex items-center justify-between rounded-xl border border-border/60 p-4">
                                <div>
                                    <p className="text-sm font-medium">Active</p>
                                    <p className="text-xs text-muted-foreground">Visible to customers when choosing a plan.</p>
                                </div>
                                <Switch checked={form.is_active} onCheckedChange={(v) => set('is_active', v)} aria-label="Active" />
                            </div>

                            <DialogFooter className="gap-2 sm:gap-0">
                                <Button type="button" variant="ghost" disabled={processing} onClick={() => setOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={processing} aria-busy={processing} className="min-w-36">
                                    {processing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            {mode === 'edit' ? 'Saving…' : 'Creating…'}
                                        </>
                                    ) : mode === 'edit' ? (
                                        'Save changes'
                                    ) : mode === 'clone' ? (
                                        'Create copy'
                                    ) : (
                                        'Create plan'
                                    )}
                                </Button>
                            </DialogFooter>
                        </fieldset>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!toDelete}
                onOpenChange={(v) => !v && setToDelete(null)}
                title={`Delete “${toDelete?.name ?? ''}”?`}
                description="Its monthly and yearly options will no longer be available. This can’t be undone."
                confirmLabel="Delete plan"
                destructive
                loading={processing}
                onConfirm={confirmDelete}
            />
        </SettingsSection>
    );
}