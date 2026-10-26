import { useContactWidget } from '@/components/widget/contact-widget';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { BillingPlan } from '@/types';
import { router } from '@inertiajs/react';
import { Check, LayoutGrid, Loader2, Mail, MessageCircle, Minus, Phone } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { ConfirmDialog, EmptyState, FeatureIcon, normalizeFeatures } from './billing-ui';
import { useBillingBase } from './use-billing-base';

const intervalShort: Record<string, string> = { month: 'mo', year: 'yr' };

const billedLabel = (interval: string) =>
    interval === 'month' ? 'Billed monthly' : interval === 'year' ? 'Billed annually' : `Billed per ${interval}`;

/** "$1,490.00" -> 1490 (los precios llegan ya formateados desde el backend). */
function parsePrice(price: string): number {
    const n = parseFloat(price.replace(/[^0-9.,]/g, '').replace(/,/g, ''));
    return Number.isFinite(n) ? n : 0;
}

const INTERVAL_TABS = [
    { value: 'month', label: 'Monthly billing' },
    { value: 'year', label: 'Yearly billing' },
] as const;

/* -------------------------------------------------------------------------- */
/*  Acciones de contacto del header (usa ContactWidgetProvider si existe)      */
/* -------------------------------------------------------------------------- */

function HeaderAction({
    label,
    href,
    icon: Icon,
    external,
}: {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    external?: boolean;
}) {
    return (
        <a
            href={href}
            aria-label={label}
            {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
            className="group relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
            <Icon className="h-[18px] w-[18px]" />
            {/* Tooltip hacia abajo: el contenedor del dialog hace scroll y recortaría uno hacia arriba. */}
            <span
                role="tooltip"
                className="pointer-events-none absolute right-0 top-full z-10 mt-2 whitespace-nowrap rounded-lg border border-border/60 bg-popover px-3 py-1.5 text-xs font-medium text-popover-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
            >
                {label}
            </span>
        </a >
    );
}

function ContactActions() {
    const contact = useContactWidget();
    if (!contact) return null;

    const { phone, email, chatUrl } = contact.config;

    return (
        <div className="flex items-center gap-0.5">
            {phone && <HeaderAction label="Request a call" href={`tel:${phone}`} icon={Phone} />}
            <HeaderAction label="Send an email" href={`mailto:${email}`} icon={Mail} />
            {chatUrl && <HeaderAction label="Chat with us" href={chatUrl} icon={MessageCircle} external />}
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*  Anotación "-20%" dibujada a mano, en SVG puro                              */
/* -------------------------------------------------------------------------- */

function SavingsAnnotation({ pct }: { pct: number }) {
    const reduce = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const clipId = `arrow-reveal-${useId().replace(/:/g, '')}`;

    return (
        <div aria-hidden key={pct} className="pointer-events-none absolute top-2 left-full -ml-5 hidden w-32 select-none text-primary sm:block">
            {/* La flecha original apunta a la derecha; -scale-x-100 la voltea hacia el tab anual. */}
            <svg viewBox="0 0 1620 667.51" className="block h-auto w-full" fill="currentColor">
                <defs>
                    {/* Revela la flecha desde la cola hasta la punta (se dibuja en 0.9s). */}
                    <clipPath id={clipId}>
                        <rect x="0" y="0" width={reduce ? 1620 : 0} height="667.51">
                            {!reduce && (
                                <animate
                                    attributeName="width"
                                    from="0"
                                    to="1620"
                                    dur="0.9s"
                                    fill="freeze"
                                    calcMode="spline"
                                    keyTimes="0;1"
                                    keySplines="0.4 0 0.2 1"
                                />
                            )}
                        </rect>
                    </clipPath>
                </defs>
                <g clipPath={`url(#${clipId})`}>
                    <path d="M1057.75,172.41a20.32,20.32,0,0,0-19.63-12.78c-84,3.38-164.58-18.5-165.42-18.69a14.09,14.09,0,0,0-7.52,27.15,645.41,645.41,0,0,0,100.55,17.44,1.52,1.52,0,0,1,.71,2.78c-47.89,29.93-99.54,54.77-152.08,77.47-63,26.68-127.75,49.79-193.32,70.27l-24.71,7.61c-8.08,2.53-16,4.79-24.14,6.85-16.16,4.23-32.6,7.71-49,10.52-33,5.36-66.32,8-98.64,5.08-32.13-2.91-63.6-11.65-87.36-29.87A108.88,108.88,0,0,1,320.91,321c-2.54-2.73-4.51-5.73-6.86-8.55-2.07-3.1-4-6.67-6.11-10-2.63-4.51-5.16-9.2-7.51-13.9,6-4,12.21-8.08,17.38-12.31,6.95-5.45,13.9-10.71,20.66-16.44,27.15-22.54,53.64-46.5,76-75.8,11-14.75,21.23-30.72,27.62-49.79,6.48-18.69,7.7-41.9-1-62.19a126.51,126.51,0,0,0-7.79-14.37c-4.32-5.82-10.34-11-16.82-13.62-13.06-5.54-25.08-4.42-35.41-2.54C360.08,46,343.36,55.83,327.86,66.82a204.78,204.78,0,0,0-67.92,89.24c-13.9,35.51-15.5,76.19-5.17,112.82.85,3.2,1.69,6.3,2.73,9.3-7.33,3.1-14.66,6.3-22.17,9.21-30.91,11-64.07,16.72-97.51,19a499.35,499.35,0,0,1-50.44.75,450.33,450.33,0,0,1-49.88-4.32l-.57-.09a14.06,14.06,0,0,0-4.22,27.8,454.69,454.69,0,0,0,53.45,5.17,479.55,479.55,0,0,0,53.35-.28c35.61-2.07,71.4-7.8,105.87-19.73,8-3.1,15.78-6.29,23.67-9.58,2.45,5,5.08,9.86,7.8,14.66,2.54,4.13,4.7,8.17,7.42,12.21,3.1,3.94,5.92,8.17,9.21,11.83A145.8,145.8,0,0,0,315,365.07c31.37,24.43,69.61,34.57,106,38.24,36.73,3.66,72.9,1,108.31-4.51q26.49-4.23,52.61-10.71c8.54-2.16,17.37-4.6,25.83-7.23l24.89-7.52c66.7-20.67,132.64-44.06,197.18-71.2C862,288.33,894,273.77,925.21,257.42c16.29-8.67,32.37-17.69,48.24-27.3a1.44,1.44,0,0,1,1.88,2.14c-21.06,25.82-40.31,57.57-47.21,93.36a14.13,14.13,0,0,0,11.27,16.44,12.45,12.45,0,0,0,2.63.28,14.14,14.14,0,0,0,13.81-11.46c12-62.56,71.21-113.95,96.48-135.93A19.82,19.82,0,0,0,1057.75,172.41ZM289,259.49v-.19a145.12,145.12,0,0,1,3.38-91c10.9-29.12,30.81-55.42,55.7-74.39,12.4-9.12,26.4-17,39.55-19.73,6.48-1.41,12.59-1.22,15.5.19,1.69.47,2.26,1.41,3.2,2.35,1.41,2.34,3.28,5.54,4.69,8.36,5.08,11.83,4.89,25.26.38,39.26S398.5,151.93,388.92,165c-19.45,26-44.34,49.22-70.17,71.11-6.39,5.54-13.25,10.71-19.82,16.06C295.64,254.89,292.26,257.23,289,259.49Z" />
                </g>
            </svg>

            <span
                className={`absolute -top-3 left-[70%] -rotate-6 whitespace-nowrap text-3xl font-bold italic leading-none ${reduce ? '' : 'animate-in fade-in-0 duration-300'}`}
                style={{
                    fontFamily: "'Caveat','Segoe Script','Bradley Hand','Comic Sans MS',cursive",
                    animationDelay: '0.55s',
                    animationFillMode: 'backwards',
                }}
            >
                -{pct}%
            </span>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*  Selector de plan                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Selector de plan en un dialog: toggle mensual/anual con anotación de ahorro,
 * tarjetas con badge "Popular", features con checks y acciones de contacto.
 */
export default function PlanPickerDialog({
    open,
    onOpenChange,
    plans,
    hasAnyPlan,
    popularSlug,
    moreInfoHref,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    plans: BillingPlan[];
    hasAnyPlan: boolean;
    /** Slug del plan a marcar como "Popular". Si no se pasa y hay 3 planes, se marca el del medio. */
    popularSlug?: string;
    /** Si se pasa, muestra el pie "Find out more about our pricing…". */
    moreInfoHref?: string;
}) {
    const base = useBillingBase();

    const available = useMemo(() => new Set(plans.map((p) => p.interval)), [plans]);
    const currentInterval = plans.find((p) => p.is_current)?.interval;
    const firstAvailable = INTERVAL_TABS.find((t) => available.has(t.value))?.value ?? 'month';
    const [selected, setSelected] = useState<string>(currentInterval ?? firstAvailable);
    const interval = available.has(selected) ? selected : firstAvailable;

    // Ahorro anual vs mensual por nombre de plan, y el máximo para el toggle.
    const { savings, savingByName } = useMemo(() => {
        const monthly = plans.filter((p) => p.interval === 'month');
        const byName: Record<string, number> = {};
        let best = 0;
        plans.filter((p) => p.interval === 'year').forEach((y) => {
            const m = monthly.find((x) => x.name === y.name);
            if (!m) return;
            const full = parsePrice(m.price) * 12;
            const yearly = parsePrice(y.price);
            if (full > 0 && yearly > 0 && yearly < full) {
                const pct = Math.round((1 - yearly / full) * 100);
                byName[y.name] = pct;
                best = Math.max(best, pct);
            }
        });
        return { savings: best, savingByName: byName };
    }, [plans]);

    const visible = plans.filter((p) => p.interval === interval);
    const popularId = popularSlug
        ? visible.find((p) => p.slug === popularSlug)?.id
        : visible.length === 3
            ? visible[1].id
            : undefined;

    const [pending, setPending] = useState<BillingPlan | null>(null);
    const [switchingId, setSwitchingId] = useState<number | null>(null);
    const busy = switchingId !== null;

    function switchTo(plan: BillingPlan) {
        setSwitchingId(plan.id);
        router.patch(`${base}/plans/${plan.id}/switch`, {}, {
            preserveScroll: true,
            onFinish: () => { setSwitchingId(null); setPending(null); },
            onSuccess: () => onOpenChange(false),
        });
    }

    function choose(plan: BillingPlan) {
        if (hasAnyPlan) setPending(plan);
        else switchTo(plan);
    }

    const gridCols =
        visible.length >= 4 ? 'sm:grid-cols-2 xl:grid-cols-4'
            : visible.length === 3 ? 'md:grid-cols-3'
                : visible.length === 2 ? 'mx-auto max-w-3xl sm:grid-cols-2'
                    : 'mx-auto max-w-sm';

    return (
        <>
            <Dialog open={open} onOpenChange={(v) => !busy && onOpenChange(v)}>
                <DialogContent className="no-scrollbar max-h-[92vh] overflow-y-auto sm:max-w-5xl">
                    {/* pr-8: deja libre la X propia del dialog */}
                    <div className="flex items-start justify-between gap-4 pr-8">
                        <DialogHeader>
                            <DialogTitle className="text-2xl">Select your plan</DialogTitle>
                            <DialogDescription>Pick one of the following plans. You can change it again at any time.</DialogDescription>
                        </DialogHeader>
                        <ContactActions />
                    </div>

                    {/* Toggle mensual / anual */}
                    <div className="flex flex-col items-center gap-2 py-1">
                        <div className="relative">
                            <div role="tablist" aria-label="Billing interval" className="flex gap-1 rounded-xl border border-border/60 bg-muted p-1">
                                {INTERVAL_TABS.map((tab) => {
                                    const enabled = available.has(tab.value);
                                    return (
                                        <button
                                            key={tab.value}
                                            type="button"
                                            role="tab"
                                            aria-selected={interval === tab.value}
                                            disabled={!enabled}
                                            title={enabled ? undefined : `No ${tab.value === 'year' ? 'yearly' : 'monthly'} plans available`}
                                            onClick={() => setSelected(tab.value)}
                                            className={cn(
                                                'rounded-lg px-5 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40',
                                                interval === tab.value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                                            )}
                                        >
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>
                            {savings > 0 && available.has('year') && <SavingsAnnotation pct={savings} />}
                        </div>
                        {/* En móvil no hay espacio para la anotación: texto simple */}
                        {savings > 0 && available.has('year') && (
                            <span className="text-xs font-medium text-primary sm:hidden">Save up to {savings}% yearly</span>
                        )}
                    </div>

                    {visible.length === 0 ? (
                        <EmptyState icon={LayoutGrid} title="No plans available yet" description="Plans will appear here once they’re published." />
                    ) : (
                        <div key={interval} className={cn('grid gap-4 duration-300 animate-in fade-in-0 slide-in-from-bottom-1', gridCols)}>
                            {visible.map((plan) => {
                                const features = normalizeFeatures(plan.features);
                                const popular = plan.id === popularId;
                                const saving = plan.interval === 'year' ? savingByName[plan.name] : undefined;
                                const switching = switchingId === plan.id;

                                return (
                                    <article
                                        key={plan.id}
                                        className={cn(
                                            'flex flex-col rounded-2xl border p-5 transition-shadow sm:p-6',
                                            plan.is_current
                                                ? 'border-primary/50 bg-primary/10'
                                                : popular
                                                    ? 'border-primary/50 bg-primary/5 shadow-lg ring-1 ring-primary/20'
                                                    : 'border-border/60 bg-card hover:shadow-md',
                                        )}
                                    >
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="text-lg font-semibold">{plan.name}</h3>
                                            {popular && <Badge variant="secondary">Popular</Badge>}
                                            {plan.is_current && <Badge>Current</Badge>}
                                        </div>

                                        <p className="mt-4 flex items-baseline gap-1.5">
                                            <span className="text-4xl font-semibold tracking-tight">{plan.price}</span>
                                            <span className="text-sm text-muted-foreground">/{intervalShort[plan.interval] ?? plan.interval}</span>
                                        </p>
                                        <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                            {billedLabel(plan.interval)}
                                            {saving ? (
                                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Save {saving}%</span>
                                            ) : null}
                                        </p>

                                        <div className="my-5 border-t border-border/60" />

                                        <p className="mb-3 text-sm font-medium">Features</p>
                                        <ul className="flex-1 space-y-3 text-sm">
                                            {features.length === 0 && <li className="text-muted-foreground">No features listed.</li>}
                                            {features.map((f, i) => (
                                                <li key={i} className={cn('flex items-center gap-3', !f.included && 'text-muted-foreground opacity-60')}>
                                                    <FeatureIcon label={f.label} className={cn('h-4 w-4 shrink-0', f.included ? 'text-primary' : 'text-muted-foreground')} />
                                                    <span className={cn(!f.included && 'line-through decoration-muted-foreground/40')}>{f.label}</span>
                                                    {!f.included && <span className="sr-only">(not included)</span>}
                                                </li>
                                            ))}
                                        </ul>

                                        <Button
                                            type="button"
                                            size="lg"
                                            variant={plan.is_current ? 'secondary' : popular ? 'default' : 'outline'}
                                            className="mt-6 w-full"
                                            disabled={plan.is_current || busy}
                                            aria-busy={switching}
                                            onClick={() => choose(plan)}
                                        >
                                            {switching ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Switching…
                                                </>
                                            ) : plan.is_current ? (
                                                'Current plan'
                                            ) : hasAnyPlan ? (
                                                `Change to ${plan.name}`
                                            ) : (
                                                `Choose ${plan.name}`
                                            )}
                                        </Button>
                                    </article>
                                );
                            })}
                        </div>
                    )}

                    {moreInfoHref && (
                        <p className="text-center text-sm text-muted-foreground">
                            <a href={moreInfoHref} target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-foreground">Find out more</a>{' '}
                            about our pricing and discounts.
                        </p>
                    )}
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!pending}
                onOpenChange={(v) => !v && setPending(null)}
                title={`Switch to ${pending?.name ?? ''}?`}
                description={`You’ll move to ${pending?.name ?? 'this plan'} at ${pending?.price ?? ''} per ${pending?.interval ?? 'period'}. Your default payment method will be used.`}
                confirmLabel="Switch plan"
                loading={busy}
                onConfirm={() => pending && switchTo(pending)}
            />
        </>
    );
}