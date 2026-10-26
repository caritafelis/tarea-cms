import { Button } from '@/components/ui/button';
import { BillingSettings } from '@/types';
import { CreditCard, Mail } from 'lucide-react';
import { useState } from 'react';
import { AddPaymentMethodDrawer } from './add-card-drawer';
import { PaymentBrand, SubscriptionStatusBadge, fmtExpiry, normalizeFeatures, resolveCardGateway } from './billing-ui';

export function SubscriptionBanner({ data, onManage }: { data: BillingSettings; onManage: () => void }) {
    const primary = data.payment_methods.find((pm) => pm.is_primary) ?? data.payment_methods[0];
    const sub = data.subscription;
    const plan = data.current_plan;
    const [open, setOpen] = useState(false);

    const included = normalizeFeatures(plan?.features).filter((f) => f.included).map((f) => f.label);
    const summary = plan ? included.slice(0, 4).join(' · ') || `${plan.price}/${plan.interval}` : 'Choose a plan to get started.';
    const expiry = primary ? fmtExpiry(primary.exp_month, primary.exp_year) : null;

    return (
        <div className="rounded-2xl bg-slate-900 p-5 text-white sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold">{plan?.name ?? 'No active plan'}</h3>
                        <SubscriptionStatusBadge status={sub?.status} />
                    </div>
                    <p className="mt-1 text-sm text-slate-300">{summary}</p>
                </div>
                <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                    {sub?.ends_at && <p className="text-sm font-medium">{sub.auto_renew ? 'Renews' : 'Ends'} {sub.ends_at}</p>}
                    <Button size="sm" variant="secondary" onClick={onManage}>{plan ? 'Switch plan' : 'Choose plan'}</Button>
                </div>
            </div>

            <div className="mt-4 rounded-xl bg-slate-800/70 p-4">
                {primary ? (
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                            <PaymentBrand method={primary} className="border-transparent" />
                            <div className="min-w-0 text-sm">
                                <p className="font-medium">{primary.label}</p>
                                {expiry && <p className="text-slate-300">Expires {expiry}</p>}
                                <p className="mt-1 flex items-center gap-1.5 break-all text-slate-300">
                                    <Mail className="h-3.5 w-3.5 shrink-0" /> {data.contact.alternative_email ?? data.contact.email}
                                </p>
                            </div>
                        </div>
                        <button type="button" onClick={() => setOpen(true)} className="shrink-0 text-sm font-medium hover:underline">
                            Add another
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center justify-between gap-3">
                        <p className="flex items-center gap-2 text-sm text-slate-300">
                            <CreditCard className="h-4 w-4" /> No payment method on file.
                        </p>
                        <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>Add</Button>
                    </div>
                )}
            </div>

            <AddPaymentMethodDrawer open={open} onOpenChange={setOpen} cardGateway={resolveCardGateway(data)} />
        </div>
    );
}