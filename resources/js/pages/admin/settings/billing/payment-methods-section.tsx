import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { router } from '@inertiajs/react';
import { BillingPaymentMethod } from '@/types';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { AddPaymentMethodDrawer } from './add-card-drawer';
import { useBillingBase } from './use-billing-base';

export default function PaymentMethodsSection({ methods }: { methods: BillingPaymentMethod[] }) {
    const base = useBillingBase();
    const [open, setOpen] = useState(false);

    function setPrimary(id: number) {
        router.patch(`${base}/payment-methods/${id}/default`, {}, { preserveScroll: true });
    }

    function remove(id: number) {
        if (!confirm('Remove this payment method?')) return;
        router.delete(`${base}/payment-methods/${id}`, {
            preserveScroll: true,
            onSuccess: () => toast.success('Payment method removed.'),
        });
    }

    return (
        <div>
            <p className="font-medium">Payment methods</p>
            <p className="text-sm text-muted-foreground">Visible only for you</p>

            <div className="mt-3 space-y-3">
                {methods.length === 0 && (
                    <p className="rounded-lg border border-dashed border-border/60 p-4 text-center text-sm text-muted-foreground">
                        No payment methods on file yet.
                    </p>
                )}

                {methods.map((pm) => (
                    <div
                        key={pm.id}
                        className={`flex items-center justify-between gap-3 rounded-lg border p-4 ${pm.is_primary ? 'border-primary' : 'border-border/60'}`}
                    >
                        <div className="flex min-w-0 items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setPrimary(pm.id)}
                                aria-label="Set as default"
                                disabled={pm.is_primary}
                                className={`h-4 w-4 shrink-0 rounded-full border-2 ${pm.is_primary ? 'border-primary bg-primary' : 'border-muted-foreground/40'}`}
                            />
                            <span className="w-12 shrink-0 rounded border border-border/60 px-1.5 py-0.5 text-center text-[10px] font-bold uppercase">
                                {pm.brand ?? pm.gateway}
                            </span>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium">{pm.label}</p>
                                {pm.exp_month && pm.exp_year && (
                                    <p className="text-xs text-muted-foreground">
                                        {String(pm.exp_month).padStart(2, '0')}/{pm.exp_year}
                                        {pm.is_expired && <span className="ml-1 text-destructive">· expired</span>}
                                    </p>
                                )}
                            </div>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button type="button" className="shrink-0 text-xs font-medium text-primary hover:underline">Edit</button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {!pm.is_primary && <DropdownMenuItem onClick={() => setPrimary(pm.id)}>Set as default</DropdownMenuItem>}
                                <DropdownMenuItem className="text-destructive" onClick={() => remove(pm.id)}>Remove</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                ))}

                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                    <Plus className="h-3.5 w-3.5" /> Add payment method
                </button>
            </div>

            <AddPaymentMethodDrawer open={open} onOpenChange={setOpen} />
        </div>
    );
}