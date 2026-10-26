import { Head, router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import orderRoutes from '@/actions/App/Http/Controllers/Admin/OrderController';
import { Muted, NameCell, StatusBadge } from '@/components/admin/cells';
import { ResourceHeader } from '@/components/admin/resource-header';
import { DataTable } from '@/components/table/datatable';
import { Button } from '@/components/ui/button';
import { useTeamSlug } from '@/hooks/use-team-slug';
import { formatDate, formatMoney, humanize } from '@/lib/format';

type Order = {
    id: number; number: string | null; status: string; payment_status: string; shipping_status: string;
    price_amount: number; currency_code: string; created_at: string;
    customer?: { name: string; email: string } | null; items?: unknown[];
};

const STATUSES = ['new', 'processing', 'completed', 'cancelled', 'archived'] as const;

export default function Index({ orders }: { orders: Order[] }) {
    const team = useTeamSlug();
    const [filter, setFilter] = useState<'all' | (typeof STATUSES)[number]>('all');
    const counts = orders.reduce<Record<string, number>>((a, o) => ({ ...a, [o.status]: (a[o.status] ?? 0) + 1 }), {});
    const rows = filter === 'all' ? orders : orders.filter((o) => o.status === filter);
    const view = (o: Order) => router.visit(orderRoutes.show.url({ current_team: team, order: o.id }));

    const columns: ColumnDef<Order>[] = [
        { id: 'number', header: 'Order', cell: ({ row }) => <NameCell title={`#${row.original.number ?? row.original.id}`} subtitle={formatDate(row.original.created_at, true)} /> },
        { id: 'customer', header: 'Customer', cell: ({ row }) => <NameCell title={row.original.customer?.name ?? 'Guest'} subtitle={row.original.customer?.email} />, meta: { className: 'hidden md:table-cell' } },
        { id: 'items', header: 'Items', cell: ({ row }) => <Muted>{row.original.items?.length ?? 0}</Muted>, meta: { className: 'hidden lg:table-cell' } },
        { id: 'total', header: 'Total', cell: ({ row }) => <span className="font-bold">{formatMoney(row.original.price_amount, row.original.currency_code)}</span> },
        { id: 'payment', header: 'Payment', cell: ({ row }) => <StatusBadge value={row.original.payment_status} />, meta: { className: 'hidden md:table-cell' } },
        { id: 'shipping', header: 'Shipping', cell: ({ row }) => <StatusBadge value={row.original.shipping_status} />, meta: { className: 'hidden lg:table-cell' } },
        { id: 'status', header: 'Status', cell: ({ row }) => <StatusBadge value={row.original.status} /> },
        { id: 'actions', header: '', meta: { className: 'text-right' }, cell: ({ row }) => <div className="text-right"><Button variant="ghost" size="sm" onClick={() => view(row.original)}>View</Button></div> },
    ];

    return (
        <>
            <Head title="Orders" />
            <div className="space-y-6 p-6">
                <ResourceHeader title="Orders" description="Track customer orders, payments and fulfillment." icon={ShoppingCart} />
                <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>All ({orders.length})</Button>
                    {STATUSES.map((s) => (
                        <Button key={s} size="sm" variant={filter === s ? 'default' : 'outline'} onClick={() => setFilter(s)}>{humanize(s)} ({counts[s] ?? 0})</Button>
                    ))}
                </div>
                <DataTable columns={columns} data={rows} emptyState={<p className="py-12 text-sm text-muted-foreground">No orders found.</p>} />
            </div>
        </>
    );
}

Index.layout = { breadcrumbs: [{ title: 'Orders', href: orderRoutes.index.url() }] };