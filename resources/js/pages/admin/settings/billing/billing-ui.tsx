import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { BillingInvoice, BillingSettings, PlanFeature } from '@/types';
import {
    Activity, BarChart3, Braces, CalendarDays, Check, CreditCard, Database, FileText, Globe, GitBranch, HardDrive,
    Languages, LifeBuoy, type LucideIcon, Mail, Package, ShieldCheck, Sparkles, Terminal, Truck, Users, Webhook, AlertTriangle,
} from 'lucide-react';
import { FaApple, FaPaypal } from 'react-icons/fa6';
import { FcGoogle } from 'react-icons/fc';

export function fmtExpiry(month?: number | string | null, year?: number | string | null): string | null {
    if (!month || !year) return null;
    return `${String(month).padStart(2, '0')}/${String(year).slice(-2)}`;
}

export function normalizeFeatures(features: unknown[] | null | undefined): PlanFeature[] {
    return (features ?? [])
        .map((f) =>
            typeof f === 'string'
                ? { label: f, included: true }
                : { label: String((f as PlanFeature)?.label ?? ''), included: (f as PlanFeature)?.included ?? true },
        )
        .filter((f) => f.label);
}

export function resolveCardGateway(
    data: Pick<BillingSettings, 'subscription' | 'payment_methods' | 'manageable_plans'>,
): 'stripe' | 'nuvei' {
    const candidates = [
        data.subscription?.gateway,
        ...data.payment_methods.map((pm) => pm.gateway),
        ...(data.manageable_plans ?? []).filter((p) => p.is_active).map((p) => p.gateway),
    ];
    return candidates.find((g): g is 'stripe' | 'nuvei' => g === 'stripe' || g === 'nuvei') ?? 'stripe';
}

const featureIcons: [RegExp, LucideIcon][] = [
    [/discount|billing|payment/i, CreditCard],
    [/webhook/i, Webhook],
    [/\bapi\b|json|graphql|rest\b/i, Braces],
    [/support|help|priority|sla/i, LifeBuoy],
    [/team|seat|user|member/i, Users],
    [/product|catalog|inventory/i, Package],
    [/cms|post|page|media|content/i, FileText],
    [/ship|fedex|ups\b|delivery/i, Truck],
    [/\bai\b|insight|assistant/i, Sparkles],
    [/language|locale|translation/i, Languages],
    [/event/i, Activity],
    [/lookback|retention|history|\bdays?\b/i, CalendarDays],
    [/application|\bapps?\b/i, Terminal],
    [/environment|branch/i, GitBranch],
    [/threshold|alert|monitor/i, AlertTriangle],
    [/storage|\bgb\b|\btb\b|space/i, HardDrive],
    [/backup|database/i, Database],
    [/analytic|report|dashboard/i, BarChart3],
    [/domain|region|cdn/i, Globe],
    [/security|sso|2fa|audit/i, ShieldCheck],
    [/email|mail/i, Mail],
];

export function FeatureIcon({ label, className }: { label: string; className?: string }) {
    const Icon = featureIcons.find(([re]) => re.test(label))?.[1] ?? Check;
    return <Icon className={className} aria-hidden="true" />;
}

export function money(value: number, currency: string): string {
    try {
        return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency.toUpperCase() }).format(value);
    } catch {
        return `${value.toFixed(2)} ${currency.toUpperCase()}`;
    }
}

export function PaymentBrand({
    method,
    className,
}: {
    method: { gateway: string; brand?: string | null; type?: string | null };
    className?: string;
}) {
    const key = `${method.type ?? ''} ${method.brand ?? ''}`.toLowerCase();
    let content: React.ReactNode;

    if (method.gateway === 'paypal' || key.includes('paypal')) content = <FaPaypal className="h-5 w-5 text-[#003087]" />;
    else if (key.includes('apple')) content = <FaApple className="h-5 w-5" />;
    else if (key.includes('google')) content = <FcGoogle className="h-5 w-5" />;
    else if (key.includes('visa')) content = <span className="text-[13px] font-extrabold italic tracking-tight text-[#1a1f71] dark:text-[#8fa2ff]">VISA</span>;
    else if (key.includes('master')) {
        content = (
            <span className="relative block h-5 w-8" aria-label="Mastercard">
                <span className="absolute left-0 top-0 h-5 w-5 rounded-full bg-[#eb001b]" />
                <span className="absolute right-0 top-0 h-5 w-5 rounded-full bg-[#f79e1b] mix-blend-multiply dark:mix-blend-normal dark:opacity-90" />
            </span>
        );
    } else if (key.includes('amex') || key.includes('american')) content = <span className="text-[11px] font-bold text-[#2e77bb]">AMEX</span>;
    else content = <CreditCard className="h-5 w-5 text-muted-foreground" />;

    return (
        <span className={cn('flex h-9 w-12 shrink-0 items-center justify-center rounded-md border border-border/60 bg-background', className)}>
            {content}
        </span>
    );
}


const invoiceStatus: Record<BillingInvoice['status'], { label: string; className: string }> = {
    paid: { label: 'Paid', className: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
    open: { label: 'Processing', className: 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400' },
    void: { label: 'Void', className: 'border-border bg-muted text-muted-foreground' },
    uncollectible: { label: 'Failed', className: 'border-destructive/25 bg-destructive/10 text-destructive' },
};

export const invoiceStatusOptions = Object.entries(invoiceStatus).map(([value, v]) => ({ value, label: v.label }));

export function InvoiceStatusBadge({ status }: { status: BillingInvoice['status'] }) {
    const s = invoiceStatus[status] ?? invoiceStatus.void;
    return <Badge variant="outline" className={cn('font-medium', s.className)}>{s.label}</Badge>;
}

const subscriptionStatus: Record<string, { label: string; className: string }> = {
    active: { label: 'Active', className: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
    trialing: { label: 'Trial', className: 'border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-400' },
    past_due: { label: 'Payment failed', className: 'border-destructive/25 bg-destructive/10 text-destructive' },
    canceled: { label: 'Canceled', className: 'border-border bg-muted text-muted-foreground' },
};

export function SubscriptionStatusBadge({ status }: { status?: string | null }) {
    if (!status) return null;
    const s = subscriptionStatus[status] ?? { label: status.replace(/_/g, ' '), className: 'border-border bg-muted text-muted-foreground' };
    return <Badge variant="outline" className={cn('font-medium capitalize', s.className)}>{s.label}</Badge>;
}

export function Field({ label, error, htmlFor, children }: { label: string; error?: string; htmlFor?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <Label htmlFor={htmlFor}>{label}</Label>
            {children}
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
}: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description?: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border/60 px-6 py-10 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Icon className="h-5 w-5 text-muted-foreground" />
            </span>
            <p className="text-sm font-medium">{title}</p>
            {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
            {action && <div className="mt-2">{action}</div>}
        </div>
    );
}

export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel = 'Confirm',
    destructive,
    loading,
    onConfirm,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    title: string;
    description: string;
    confirmLabel?: string;
    destructive?: boolean;
    loading?: boolean;
    onConfirm: () => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button type="button" variant={destructive ? 'destructive' : 'default'} disabled={loading} onClick={onConfirm}>
                        {loading ? 'Working…' : confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}