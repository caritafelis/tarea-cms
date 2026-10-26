import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { SettingsTabKey } from '@/layouts/settings/layout';
import { cn } from '@/lib/utils';
import { BillingPaymentMethod, BillingSettings } from '@/types';
import { router } from '@inertiajs/react';
import { AlertTriangle, MoreVertical, Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { AddPaymentMethodDrawer } from './billing/add-card-drawer';
import { ConfirmDialog, PaymentBrand, fmtExpiry, resolveCardGateway } from './billing/billing-ui';
import HistoryTab from './billing/history-tab';
import PlanPickerDialog from './billing/plan-picker-dialog';
import { useBillingBase } from './billing/use-billing-base';

/** Una fila de la tarjeta: título + descripción a la izquierda, contenido a la derecha. */
function Row({
    title,
    description,
    end,
    children,
}: {
    title: string;
    description?: string;
    /** Alinea el contenido a la derecha (texto + botón). Si no, ocupa todo el ancho (inputs). */
    end?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div className="grid gap-3 border-b border-border/60 p-4 last:border-b-0 sm:grid-cols-[1fr_1.6fr] sm:items-center sm:gap-6">
            <div className="min-w-0">
                <p className="text-sm font-medium">{title}</p>
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
            <div className={cn('min-w-0', end && 'flex flex-wrap items-center gap-3 sm:justify-end')}>{children}</div>
        </div>
    );
}

export default function BillingTab({ data }: { data: BillingSettings; onNavigate?: (tab: SettingsTabKey) => void }) {
    const base = useBillingBase();
    const { current_plan: plan, subscription: sub, payment_methods: methods } = data;

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [planOpen, setPlanOpen] = useState(false);
    const [toRemove, setToRemove] = useState<BillingPaymentMethod | null>(null);
    const [removing, setRemoving] = useState(false);

    // El email guardado viene de las props; al guardar, Inertia recarga la página
    // y `saved` se actualiza solo, así que no necesitamos useForm().defaults().
    const saved = data.contact.alternative_email ?? data.contact.email ?? '';
    const [email, setEmail] = useState(saved);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [savingEmail, setSavingEmail] = useState(false);
    const emailDirty = email.trim() !== saved;

    function saveEmail(e: React.FormEvent) {
        e.preventDefault();
        setSavingEmail(true);
        setEmailError(null);
        router.patch(`${base}/contact`, { billing_email: email.trim() }, {
            preserveScroll: true,
            onFinish: () => setSavingEmail(false),
            onSuccess: () => toast.success('Billing email updated.'),
            onError: (errors) => {
                setEmailError(errors.billing_email ?? 'Check the email address and try again.');
                toast.error('Check the email address and try again.');
            },
        });
    }

    function setDefault(id: number) {
        router.patch(`${base}/payment-methods/${id}/default`, {}, {
            preserveScroll: true,
            onSuccess: () => toast.success('Default payment method updated.'),
        });
    }

    function confirmRemove() {
        if (!toRemove) return;
        setRemoving(true);
        router.delete(`${base}/payment-methods/${toRemove.id}`, {
            preserveScroll: true,
            onFinish: () => { setRemoving(false); setToRemove(null); },
            onSuccess: () => toast.success('Payment method removed.'),
            onError: () => toast.error('We couldn’t remove this payment method.'),
        });
    }

    return (
        <div className="space-y-6">
            {data.alerts.incomplete_billing_details && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Your billing details are incomplete</AlertTitle>
                    <AlertDescription>Add an invoice email and a payment method to keep your account in good standing.</AlertDescription>
                </Alert>
            )}

            <section className="rounded-2xl border border-border/60 p-3 sm:p-4">
                <h2 className="px-2 pb-3 pt-2 text-lg font-semibold">Payment details</h2>

                <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/20">
                    {/* Plan */}
                    <Row title="Plan" description={plan?.name ?? 'No active plan'} end>
                        {plan && (
                            <p className="text-sm text-muted-foreground">
                                {plan.price} per {plan.interval}
                                {sub?.ends_at && <> • {sub.auto_renew ? 'Renews on' : 'Ends on'} {sub.ends_at}</>}
                            </p>
                        )}
                        <Button type="button" size="sm" variant="outline" onClick={() => setPlanOpen(true)}>
                            {plan ? 'Change' : 'Choose a plan'}
                        </Button>
                    </Row>

                    {/* Payments */}
                    <Row
                        title="Payments"
                        description={methods.length === 0 ? 'No payment method added' : 'The default method is charged on renewal'}
                        end={methods.length === 0}
                    >
                        {methods.length === 0 ? (
                            <Button type="button" size="sm" variant="outline" onClick={() => setDrawerOpen(true)}>Add card</Button>
                        ) : (
                            <div className="space-y-2">
                                <ul className="space-y-2">
                                    {methods.map((pm) => {
                                        const exp = fmtExpiry(pm.exp_month, pm.exp_year);
                                        return (
                                            <li
                                                key={pm.id}
                                                className={cn(
                                                    'flex items-center gap-3 rounded-lg border bg-background/40 p-2.5',
                                                    pm.is_primary ? 'border-primary/40' : 'border-border/60',
                                                )}
                                            >
                                                <PaymentBrand method={pm} />
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium">{pm.label}</p>
                                                    {exp && (
                                                        <p className={cn('text-xs', pm.is_expired ? 'text-destructive' : 'text-muted-foreground')}>
                                                            {pm.is_expired ? 'Expired' : 'Expires'} {exp}
                                                        </p>
                                                    )}
                                                </div>
                                                {pm.is_primary && <Badge>Default</Badge>}
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button type="button" size="icon" variant="ghost" aria-label={`Options for ${pm.label}`}>
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {!pm.is_primary && <DropdownMenuItem onClick={() => setDefault(pm.id)}>Set as default</DropdownMenuItem>}
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            disabled={pm.is_primary && methods.length > 1}
                                                            onClick={() => setToRemove(pm)}
                                                        >
                                                            {pm.is_primary && methods.length > 1 ? 'Set another default to remove' : 'Remove'}
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </li>
                                        );
                                    })}
                                </ul>
                                <Button type="button" size="sm" variant="outline" onClick={() => setDrawerOpen(true)}>
                                    <Plus className="mr-1.5 h-3.5 w-3.5" /> Add card
                                </Button>
                            </div>
                        )}
                    </Row>

                    {/* Billing email */}
                    <Row title="Billing email" description="Email address for invoices and billing">
                        <form onSubmit={saveEmail} className="flex flex-col gap-2 sm:flex-row">
                            <div className="flex-1">
                                <Input
                                    aria-label="Billing email"
                                    type="email"
                                    autoComplete="email"
                                    placeholder="billing@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                {emailError && <p className="mt-1.5 text-xs text-destructive">{emailError}</p>}
                            </div>
                            <Button type="submit" className="shrink-0" disabled={!emailDirty || savingEmail}>
                                {savingEmail ? 'Saving…' : 'Save'}
                            </Button>
                        </form>
                    </Row>
                </div>
            </section>

            <HistoryTab invoices={data.invoices} title="Invoices" />

            <PlanPickerDialog open={planOpen} onOpenChange={setPlanOpen} plans={data.plans} hasAnyPlan={!!plan} />

            <AddPaymentMethodDrawer open={drawerOpen} onOpenChange={setDrawerOpen} cardGateway={resolveCardGateway(data)} />

            <ConfirmDialog
                open={!!toRemove}
                onOpenChange={(v) => !v && setToRemove(null)}
                title="Remove payment method?"
                description={`${toRemove?.label ?? 'This payment method'} will be removed from your account.`}
                confirmLabel="Remove"
                destructive
                loading={removing}
                onConfirm={confirmRemove}
            />
        </div>
    );
}