import type { ReactNode } from 'react';
import { useEntitlements } from '@/hooks/use-entitlements';

type Props = {
    module?: string;
    field?: string;
    children: ReactNode;
    fallback?: ReactNode;
    showUpgrade?: boolean;
};

export function Feature({ module, field, children, fallback = null, showUpgrade }: Props) {
    const { hasModule, canUseField } = useEntitlements();

    const allowed = field ? canUseField(field) : module ? hasModule(module) : true;
    if (allowed) return <>{children}</>;

    if (showUpgrade) {
        return (
            <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                🔒 This option isn't included in your plan.{' '}
                <a href="settings?tab=billing" className="underline">Upgrade</a>
            </div>
        );
    }
    return <>{fallback}</>;
}