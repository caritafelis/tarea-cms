import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { BillingPlan, BillingSettings } from '@/types';
import { LayoutGrid } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AutoRenewSwitch } from './auto-renew-switch';
import { EmptyState } from './billing-ui';
import PlanCard from './plan-card';
import PlanManager from './plan-manager';

// Reemplaza por tu correo/URL real de soporte.
const SUPPORT_EMAIL = 'support@example.com';

export default function ManageTab({ data }: { data: BillingSettings }) {
    const sub = data.subscription;

    return (
        <div className="space-y-6">
            <Card className="border-border/60 bg-muted/30">
                <CardContent className="flex items-center justify-between gap-4 p-4">
                    <div>
                        <label htmlFor="manage-auto-renew" className="text-sm font-medium">Auto-renewal</label>
                        <p className="text-xs text-muted-foreground">
                            {sub
                                ? sub.auto_renew
                                    ? `Your plan renews automatically${sub.ends_at ? ` on ${sub.ends_at}` : ''}.`
                                    : `Your plan won’t renew${sub.ends_at ? ` after ${sub.ends_at}` : ''}.`
                                : 'Choose a plan to enable auto-renewal.'}
                        </p>
                    </div>
                    <AutoRenewSwitch id="manage-auto-renew" enabled={sub?.auto_renew ?? false} disabled={!sub} endsAt={sub?.ends_at} />
                </CardContent>
            </Card>

            <PlansGrid plans={data.plans} hasAnyPlan={!!data.current_plan} currentInterval={data.current_plan?.interval} />
            <PlanManager plans={data.manageable_plans ?? []} />
            <SupportBanner />
        </div>
    );
}

function PlansGrid({ plans, hasAnyPlan, currentInterval }: { plans: BillingPlan[]; hasAnyPlan: boolean; currentInterval?: string }) {
    const intervals = useMemo(() => Array.from(new Set(plans.map((p) => p.interval))), [plans]);
    const [interval, setInterval] = useState<string>(currentInterval ?? intervals[0] ?? 'month');
    const active = intervals.includes(interval) ? interval : intervals[0];
    const visible = intervals.length > 1 ? plans.filter((p) => p.interval === active) : plans;

    return (
        <section className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-sm font-medium">Plans</p>
                    <p className="text-xs text-muted-foreground">Upgrade or switch plans whenever your needs change.</p>
                </div>

                {intervals.length > 1 && (
                    <div role="tablist" aria-label="Billing interval" className="flex gap-1 rounded-lg bg-muted p-1">
                        {intervals.map((i) => (
                            <button
                                key={i}
                                type="button"
                                role="tab"
                                aria-selected={active === i}
                                onClick={() => setInterval(i)}
                                className={cn(
                                    'rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                    active === i ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground',
                                )}
                            >
                                {i === 'month' ? 'Monthly' : i === 'year' ? 'Yearly' : i}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {visible.length === 0 ? (
                <EmptyState icon={LayoutGrid} title="No plans available yet" description="Plans you create in the plan manager below will appear here." />
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {visible.map((plan) => (
                        <PlanCard key={plan.id} plan={plan} hasAnyPlan={hasAnyPlan} />
                    ))}
                </div>
            )}
        </section>
    );
}

function SupportBanner() {
    return (
        <Card className="border-border/60 bg-muted/30">
            <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                <p className="text-sm font-medium">Need help with your subscription?</p>
                <p className="max-w-md text-sm text-muted-foreground">
                    Our customer success team can help you change plans, fix a payment or answer billing questions.
                </p>
                <Button size="sm" asChild>
                    <a href={`mailto:${SUPPORT_EMAIL}?subject=Subscription%20help`}>Contact support</a>
                </Button>
            </CardContent>
        </Card>
    );
}