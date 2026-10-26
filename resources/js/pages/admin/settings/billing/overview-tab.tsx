import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BillingSettings, BillingTabKey } from '@/types';
import { AlertTriangle, CalendarClock, Check, CreditCard, Download, FileText } from 'lucide-react';
import { AutoRenewSwitch } from './auto-renew-switch';
import { EmptyState, InvoiceStatusBadge, PaymentBrand, SubscriptionStatusBadge, fmtExpiry, normalizeFeatures } from './billing-ui';
import { useBillingBase } from './use-billing-base';

export default function OverviewTab({ data, onNavigate }: { data: BillingSettings; onNavigate: (tab: BillingTabKey) => void }) {
    const base = useBillingBase();
    const { subscription: sub, current_plan: plan } = data;
    const primary = data.payment_methods.find((pm) => pm.is_primary) ?? data.payment_methods[0];
    const expiry = primary ? fmtExpiry(primary.exp_month, primary.exp_year) : null;
    const features = normalizeFeatures(plan?.features).filter((f) => f.included).slice(0, 4);
    const recent = data.invoices.slice(0, 3);

    const openPdf = (id: number) => window.open(`${base}/invoices/${id}/download`, '_blank');

    return (
        <div className="space-y-4">
            {data.alerts.plan_expiring && (
                <Alert className="border-amber-500/40 bg-amber-500/10">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Your plan ends on {data.alerts.plan_expiring}</AlertTitle>
                    <AlertDescription>
                        <button type="button" className="underline" onClick={() => onNavigate('manage')}>Turn auto-renewal back on</button>
                    </AlertDescription>
                </Alert>
            )}

            {data.alerts.incomplete_billing_details && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Your billing details are incomplete</AlertTitle>
                    <AlertDescription>
                        <button type="button" className="underline" onClick={() => onNavigate('details')}>Add your billing email</button>
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid gap-4 lg:grid-cols-5">
                {/* Plan actual */}
                <section className="rounded-2xl border border-border/60 p-5 lg:col-span-3">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-sm text-muted-foreground">Current plan</p>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                <h2 className="text-xl font-semibold">{plan?.name ?? 'No active plan'}</h2>
                                <SubscriptionStatusBadge status={sub?.status} />
                            </div>
                            {plan && (
                                <p className="mt-1 text-2xl font-semibold tracking-tight">
                                    {plan.price}<span className="text-sm font-normal text-muted-foreground"> / {plan.interval}</span>
                                </p>
                            )}
                        </div>
                        <Button size="sm" variant="outline" onClick={() => onNavigate('manage')}>
                            {plan ? 'Switch plan' : 'Choose a plan'}
                        </Button>
                    </div>

                    {features.length > 0 && (
                        <ul className="mt-4 grid gap-1.5 text-sm sm:grid-cols-2">
                            {features.map((f) => (
                                <li key={f.label} className="flex items-center gap-2">
                                    <Check className="h-4 w-4 shrink-0 text-primary" /> {f.label}
                                </li>
                            ))}
                        </ul>
                    )}

                    {sub && (
                        <div className="mt-5 space-y-3 border-t border-border/60 pt-4 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-muted-foreground">
                                    <CalendarClock className="h-4 w-4" /> {sub.auto_renew ? 'Next payment' : 'Access until'}
                                </span>
                                <span className="font-medium">{sub.ends_at ?? '—'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <label htmlFor="overview-auto-renew" className="text-muted-foreground">Auto-renew</label>
                                <AutoRenewSwitch id="overview-auto-renew" enabled={sub.auto_renew} endsAt={sub.ends_at} />
                            </div>
                        </div>
                    )}
                </section>

                {/* Método de pago */}
                <section className="rounded-2xl border border-border/60 p-5 lg:col-span-2">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Payment method</p>
                        <Button size="sm" variant="ghost" onClick={() => onNavigate('details')}>Manage</Button>
                    </div>
                    {primary ? (
                        <div className="mt-4 flex items-center gap-3">
                            <PaymentBrand method={primary} />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">{primary.label}</p>
                                {expiry && (
                                    <p className={`text-xs ${primary.is_expired ? 'text-destructive' : 'text-muted-foreground'}`}>
                                        {primary.is_expired ? 'Expired' : 'Expires'} {expiry}
                                    </p>
                                )}
                            </div>
                            <Badge>Default</Badge>
                        </div>
                    ) : (
                        <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                            <CreditCard className="h-4 w-4" /> No payment method on file.
                        </p>
                    )}
                </section>
            </div>

            {/* Facturas recientes */}
            <section className="rounded-2xl border border-border/60 p-5">
                <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-medium">Recent invoices</p>
                    {recent.length > 0 && <Button size="sm" variant="ghost" onClick={() => onNavigate('invoices')}>View all</Button>}
                </div>
                {recent.length === 0 ? (
                    <EmptyState icon={FileText} title="No invoices yet" description="Your invoices will show up here after your first payment." />
                ) : (
                    <ul className="divide-y divide-border/60">
                        {recent.map((inv) => (
                            <li key={inv.id} className="flex items-center justify-between gap-3 py-3">
                                <div className="flex min-w-0 items-center gap-3">
                                    <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium">Invoice #{inv.number}</p>
                                        <p className="text-xs text-muted-foreground">{inv.paid_at ?? 'Pending'} · {inv.amount}</p>
                                    </div>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                    <InvoiceStatusBadge status={inv.status} />
                                    <Button size="icon" variant="ghost" aria-label="Download invoice" disabled={!inv.pdf_url} onClick={() => openPdf(inv.id)}>
                                        <Download className="h-4 w-4" />
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}