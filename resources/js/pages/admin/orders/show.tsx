import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import orderRoutes from '@/actions/App/Http/Controllers/Admin/OrderController';
import { Muted, StatusBadge } from '@/components/admin/cells';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCan } from '@/hooks/use-can';
import { useTeamSlug } from '@/hooks/use-team-slug';
import { formatDate, formatMoney, humanize } from '@/lib/format';

const STATUSES = ['new', 'processing', 'completed', 'cancelled', 'archived'];

const Address = ({ a }: { a?: Record<string, any> | null }) =>
    a ? (
        <div className="space-y-0.5 text-sm">
            <p className="font-medium">{[a.first_name, a.last_name].filter(Boolean).join(' ')}</p>
            {[a.company, a.street_address, a.street_address_plus, [a.postal_code, a.city].filter(Boolean).join(' '), a.state, a.phone_number]
                .filter(Boolean)
                .map((l: string, i: number) => <p key={i} className="text-muted-foreground">{l}</p>)}
        </div>
    ) : (
        <Muted>—</Muted>
    );

const Card2 = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Card>
        <CardHeader><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
        <CardContent>{children}</CardContent>
    </Card>
);

export default function ShowOrder({ order: o }: { order: Record<string, any> }) {
    const team = useTeamSlug();
    const can = useCan();
    const [status, setStatus] = useState<string>(o.status);
    const cur = o.currency_code;
    const items: any[] = o.items ?? [];
    const line = (i: any) => i.quantity * i.unit_price_amount - (i.discount_amount ?? 0);
    const subtotal = items.reduce((s, i) => s + line(i), 0);

    return (
        <>
            <Head title={`Order #${o.number ?? o.id}`} />
            <div className="mx-auto max-w-5xl space-y-6 p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="outline" size="icon">
                            <Link href={orderRoutes.index.url({ current_team: team })}><ArrowLeft className="h-4 w-4" /></Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Order #{o.number ?? o.id}</h1>
                            <Muted>{formatDate(o.created_at, true)}</Muted>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <StatusBadge value={o.status} />
                        <StatusBadge value={o.payment_status} />
                        <StatusBadge value={o.shipping_status} />
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
                    <div className="space-y-6">
                        <Card2 title={`Items (${items.length})`}>
                            <div className="divide-y text-sm">
                                {items.map((i) => (
                                    <div key={i.id} className="flex items-center justify-between gap-3 py-2">
                                        <div className="min-w-0">
                                            <p className="truncate font-medium">{i.name}</p>
                                            <Muted>{i.sku ? `${i.sku} · ` : ''}{i.quantity} × {formatMoney(i.unit_price_amount, cur)}{i.discount_amount ? ` · −${formatMoney(i.discount_amount, cur)}` : ''}</Muted>
                                        </div>
                                        <span className="font-medium">{formatMoney(line(i), cur)}</span>
                                    </div>
                                ))}
                            </div>
                            <dl className="mt-4 space-y-1 border-t pt-3 text-sm">
                                <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{formatMoney(subtotal, cur)}</dd></div>
                                <div className="flex justify-between"><dt className="text-muted-foreground">Tax</dt><dd>{formatMoney(o.tax_amount, cur)}</dd></div>
                                <div className="flex justify-between text-base font-bold"><dt>Total</dt><dd>{formatMoney(o.price_amount, cur)}</dd></div>
                            </dl>
                        </Card2>

                        <Card2 title="Transactions">
                            <div className="divide-y text-sm">
                                {(o.transactions ?? []).length === 0 && <Muted>No transactions.</Muted>}
                                {(o.transactions ?? []).map((t: any) => (
                                    <div key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                                        <div className="flex items-center gap-2"><StatusBadge value={t.type} /><StatusBadge value={t.status} /></div>
                                        <Muted>{formatMoney(t.amount, t.currency_code ?? cur)} · {t.reference ?? t.driver} · {formatDate(t.created_at, true)}</Muted>
                                    </div>
                                ))}
                            </div>
                        </Card2>

                        {o.refund && (
                            <Card2 title="Refund">
                                <div className="flex items-center justify-between text-sm">
                                    <StatusBadge value={o.refund.status} />
                                    <Muted>{o.refund.reason ?? ''}</Muted>
                                </div>
                            </Card2>
                        )}
                    </div>

                    <div className="space-y-6">
                        {can('update_order') && (
                            <Card2 title="Order status">
                                <div className="space-y-3">
                                    <Select value={status} onValueChange={setStatus}>
                                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {STATUSES.map((s) => <SelectItem key={s} value={s}>{humanize(s)}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        className="w-full" disabled={status === o.status}
                                        onClick={() => router.put(orderRoutes.update.url({ current_team: team, order: o.id }), { status }, { preserveScroll: true })}
                                    >
                                        Save status
                                    </Button>
                                </div>
                            </Card2>
                        )}
                        <Card2 title="Customer">
                            <p className="text-sm font-medium">{o.customer?.name ?? 'Guest'}</p>
                            <Muted>{o.customer?.email}</Muted>
                        </Card2>
                        <Card2 title="Shipping address"><Address a={o.shipping_address ?? o.shippingAddress} /></Card2>
                        <Card2 title="Billing address"><Address a={o.billing_address ?? o.billingAddress} /></Card2>
                        <Card2 title="Delivery & payment">
                            <p className="text-sm">{(o.shipping_option ?? o.shippingOption)?.name ?? '—'}</p>
                            <Muted>{(o.payment_method ?? o.paymentMethod)?.title ?? 'No payment method'}</Muted>
                        </Card2>
                    </div>
                </div>
            </div>
        </>
    );
}