import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { BillingPaymentMethod } from '@/types';
import { router } from '@inertiajs/react';
import { CreditCard, MoreVertical, Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { AddPaymentMethodDrawer } from './add-card-drawer';
import { ConfirmDialog, EmptyState, PaymentBrand, fmtExpiry } from './billing-ui';
import { useBillingBase } from './use-billing-base';

export function PaymentMethodsCard({
    methods,
    cardGateway,
}: {
    methods: BillingPaymentMethod[];
    /** Gateway que procesa tarjetas (lo decide el backend). */
    cardGateway?: 'stripe' | 'nuvei';
}) {
    const base = useBillingBase();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [toRemove, setToRemove] = useState<BillingPaymentMethod | null>(null);
    const [busy, setBusy] = useState(false);

    function setDefault(id: number) {
        router.patch(`${base}/payment-methods/${id}/default`, {}, {
            preserveScroll: true,
            onSuccess: () => toast.success('Default payment method updated.'),
        });
    }

    function confirmRemove() {
        if (!toRemove) return;
        setBusy(true);
        router.delete(`${base}/payment-methods/${toRemove.id}`, {
            preserveScroll: true,
            onFinish: () => { setBusy(false); setToRemove(null); },
            onSuccess: () => toast.success('Payment method removed.'),
            onError: () => toast.error('We couldn’t remove this payment method.'),
        });
    }

    const addButton = (
        <Button size="sm" onClick={() => setDrawerOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Add payment method
        </Button>
    );

    return (
        <Card className="border-border/60">
            <CardContent className="p-4 sm:p-5">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm font-medium">Payment methods</p>
                        <p className="text-xs text-muted-foreground">Your default method is charged for renewals. Visible only to you.</p>
                    </div>
                    {methods.length > 0 && addButton}
                </div>

                {methods.length === 0 ? (
                    <EmptyState
                        icon={CreditCard}
                        title="No payment methods yet"
                        description="Add a card, Apple Pay, Google Pay or PayPal to pay for your subscription."
                        action={addButton}
                    />
                ) : (
                    <ul className="space-y-2">
                        {methods.map((pm) => {
                            const exp = fmtExpiry(pm.exp_month, pm.exp_year);
                            return (
                                <li
                                    key={pm.id}
                                    className={cn(
                                        'flex items-center gap-3 rounded-xl border p-3 transition-colors',
                                        pm.is_primary ? 'border-primary/40 bg-primary/5' : 'border-border/60',
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
                                            <Button size="icon" variant="ghost" aria-label={`Options for ${pm.label}`}>
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
                )}
            </CardContent>

            <AddPaymentMethodDrawer open={drawerOpen} onOpenChange={setDrawerOpen} cardGateway={cardGateway} />

            <ConfirmDialog
                open={!!toRemove}
                onOpenChange={(v) => !v && setToRemove(null)}
                title="Remove payment method?"
                description={`${toRemove?.label ?? 'This payment method'} will be removed from your account.`}
                confirmLabel="Remove"
                destructive
                loading={busy}
                onConfirm={confirmRemove}
            />
        </Card>
    );
}