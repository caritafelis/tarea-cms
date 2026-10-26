import { Switch } from '@/components/ui/switch';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from './billing-ui';
import { useBillingBase } from './use-billing-base';

/**
 * Switch de renovación automática. Activar es inmediato; desactivar pide
 * confirmación (en el backend equivale a cancelar al final del periodo).
 */
export function AutoRenewSwitch({
    id,
    enabled,
    disabled,
    endsAt,
}: {
    id?: string;
    enabled: boolean;
    disabled?: boolean;
    endsAt?: string | null;
}) {
    const base = useBillingBase();
    const [confirmOff, setConfirmOff] = useState(false);
    const [processing, setProcessing] = useState(false);

    function update(value: boolean) {
        setProcessing(true);
        router.patch(`${base}/auto-renewal`, { enabled: value }, {
            preserveScroll: true,
            onFinish: () => { setProcessing(false); setConfirmOff(false); },
            onSuccess: () => toast.success(value ? 'Auto-renewal enabled.' : 'Auto-renewal disabled.'),
            onError: () => toast.error('We couldn’t update auto-renewal. Try again.'),
        });
    }

    return (
        <>
            <Switch
                id={id}
                aria-label="Auto-renew subscription"
                checked={enabled}
                disabled={disabled || processing}
                onCheckedChange={(v) => (v ? update(true) : setConfirmOff(true))}
            />
            <ConfirmDialog
                open={confirmOff}
                onOpenChange={setConfirmOff}
                title="Turn off auto-renewal?"
                description={`Your plan won’t renew${endsAt ? ` after ${endsAt}` : ''}. You keep access until the current period ends, and you can turn it back on any time.`}
                confirmLabel="Turn off"
                destructive
                loading={processing}
                onConfirm={() => update(false)}
            />
        </>
    );
}