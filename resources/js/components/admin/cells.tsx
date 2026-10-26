import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { humanize } from '@/lib/format';
import { cn } from '@/lib/utils';

const tones = {
    green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    gray: 'bg-muted text-muted-foreground',
} as const;

export type Tone = keyof typeof tones;

const statusTone: Record<string, Tone> = {
    new: 'amber', pending: 'amber', unfulfilled: 'amber',
    processing: 'blue', authorized: 'blue', shipped: 'blue', partially_shipped: 'blue', initiate: 'blue',
    completed: 'green', paid: 'green', delivered: 'green', partially_delivered: 'green', success: 'green', capture: 'green',
    cancelled: 'red', voided: 'red', failed: 'red', refunded: 'red', partially_refunded: 'red', returned: 'red', partially_returned: 'red', refund: 'red',
    archived: 'gray',
};

export function Muted({ children, className }: { children: ReactNode; className?: string }) {
    return <span className={cn('text-xs text-muted-foreground', className)}>{children}</span>;
}

export function StatusBadge({ value, tone }: { value?: string | null; tone?: Tone }) {
    if (!value) return <Muted>—</Muted>;

    return (
        <Badge
            variant="outline"
            className={cn('border-transparent text-[10px] font-bold uppercase tracking-widest', tones[tone ?? statusTone[value] ?? 'gray'])}
        >
            {humanize(value)}
        </Badge>
    );
}

export function EnabledBadge({ enabled, on = 'Enabled', off = 'Disabled' }: { enabled: boolean; on?: string; off?: string }) {
    return <StatusBadge value={enabled ? on : off} tone={enabled ? 'green' : 'gray'} />;
}

export function NameCell({ title, subtitle }: { title: ReactNode; subtitle?: ReactNode }) {
    return (
        <div className="min-w-0">
            <p className="truncate font-bold text-foreground">{title}</p>
            {subtitle ? <p className="truncate text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
    );
}