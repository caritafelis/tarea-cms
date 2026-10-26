import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BillingPlan } from '@/types';
import { router } from '@inertiajs/react';
import { CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog, FeatureIcon, normalizeFeatures } from './billing-ui';
import { useBillingBase } from './use-billing-base';

export default function PlanCard({ plan, hasAnyPlan }: { plan: BillingPlan; hasAnyPlan: boolean }) {
    const base = useBillingBase();
    const [confirm, setConfirm] = useState(false);
    const [busy, setBusy] = useState(false);
    const features = normalizeFeatures(plan.features);

    function switchPlan() {
        setBusy(true);
        router.patch(`${base}/plans/${plan.id}/switch`, {}, {
            preserveScroll: true,
            onFinish: () => { setBusy(false); setConfirm(false); },
        });
    }

    return (
        <div className={cn('flex flex-col gap-5 rounded-2xl border p-5', plan.is_current ? 'border-primary bg-primary/5' : 'border-border/60')}>
            <div>
                <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{plan.name}</p>
                    {plan.is_current && <Badge>Current</Badge>}
                </div>
                <p className="mt-1 text-3xl font-semibold tracking-tight">
                    {plan.price}<span className="text-sm font-normal text-muted-foreground"> / {plan.interval}</span>
                </p>
            </div>

            {plan.is_current ? (
                <Button variant="outline" disabled className="gap-2 bg-background">
                    <CheckCircle2 className="h-4 w-4" /> You’re on this plan
                </Button>
            ) : (
                <Button disabled={busy} onClick={() => (hasAnyPlan ? setConfirm(true) : switchPlan())}>
                    {busy ? 'Working…' : hasAnyPlan ? 'Switch to this plan' : 'Choose this plan'}
                </Button>
            )}

            <ul className="space-y-2 border-t border-border/60 pt-4 text-sm">
                {features.length === 0 && <li className="text-muted-foreground">No features listed.</li>}
                {features.map((f) => (
                    <li key={f.label} className={cn('flex items-center gap-3', !f.included && 'text-muted-foreground opacity-60')}>
                        <FeatureIcon label={f.label} className={cn('h-4 w-4 shrink-0', f.included ? 'text-primary' : 'text-muted-foreground')} />
                        {f.label}
                        {!f.included && <span className="sr-only"> (not included)</span>}
                    </li>
                ))}
            </ul>

            <ConfirmDialog
                open={confirm}
                onOpenChange={setConfirm}
                title={`Switch to ${plan.name}?`}
                description={`You’ll move to ${plan.name} at ${plan.price} per ${plan.interval}. Your default payment method will be used.`}
                confirmLabel="Switch plan"
                loading={busy}
                onConfirm={switchPlan}
            />
        </div>
    );
}