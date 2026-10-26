import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { router } from '@inertiajs/react';
import { BillingSettings } from '@/types';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';
import { useBillingBase } from './billing/use-billing-base';
import PlanCard from './billing/plan-card';
import PlanManager from './billing/plan-manager';

export default function PlanTab({ data }: { data: BillingSettings }) {
    const base = useBillingBase();
    const hasAnyPlan = Boolean(data.current_plan);

    function toggleRenew(enabled: boolean) {
        router.patch(`${base}/auto-renewal`, { enabled }, {
            preserveScroll: true,
            onSuccess: () => toast.success(enabled ? 'Auto-renewal enabled.' : 'Auto-renewal disabled.'),
        });
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold">Plan settings</h2>
                <p className="text-sm text-muted-foreground">You can upgrade your plan at any time to unlock additional features.</p>
            </div>

            {data.alerts.plan_expiring && (
                <Alert className="border-amber-500/40 bg-amber-500/10">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Your plan is going to expire on {data.alerts.plan_expiring}</AlertTitle>
                    <AlertDescription>Switch or renew your plan below to keep consistent access.</AlertDescription>
                </Alert>
            )}

            {data.subscription && (
                <div className="flex items-center justify-between rounded-lg border border-border/60 p-4">
                    <div>
                        <p className="text-sm font-medium">Auto-renew subscription</p>
                        <p className="text-xs text-muted-foreground">If off, your plan will not renew at the end of the period.</p>
                    </div>
                    <Switch checked={data.subscription.auto_renew} onCheckedChange={toggleRenew} />
                </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {data.plans.map((plan) => (
                    <PlanCard key={plan.id} plan={plan} hasAnyPlan={hasAnyPlan} />
                ))}
                {data.plans.length === 0 && (
                    <p className="col-span-full rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                        No plans available yet. Create one below.
                    </p>
                )}
            </div>

            <PlanManager plans={data.manageable_plans ?? []} />
        </div>
    );
}