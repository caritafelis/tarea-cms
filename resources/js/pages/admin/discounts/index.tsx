import type { ColumnDef } from '@tanstack/react-table';
import { Ticket } from 'lucide-react';
import discountRoutes from '@/actions/App/Http/Controllers/Admin/DiscountController';
import { EnabledBadge, Muted, NameCell } from '@/components/admin/cells';
import { CrudPage, type CrudRoutes } from '@/components/admin/crud-page';
import type { CrudField } from '@/components/admin/form-fields';
import { formatDate } from '@/lib/format';
import { crudPages } from '@/components/admin/resources';

type Zone = { id: number; name: string };
type Discount = {
    id: number;
    code: string;
    type: string;
    value: number;
    apply_to: string;
    min_required: string;
    min_required_value: string | null;
    eligibility: string;
    usage_limit: number | null;
    usage_limit_per_user: boolean;
    start_at: string;
    end_at: string | null;
    is_active: boolean;
    zone_id: number;
    zone?: Zone | null;
};

// Valores alineados con App\Enums\Discount* (los que consumen DiscountValidator/DiscountCalculator).
const opts = (pairs: [string, string][]) => pairs.map(([value, label]) => ({ value, label }));

const columns: ColumnDef<Discount>[] = [
    {
        accessorKey: 'code',
        header: 'Code',
        cell: ({ row }) => <NameCell title={row.original.code} subtitle={row.original.zone?.name} />,
    },
    {
        id: 'value',
        header: 'Value',
        cell: ({ row }) => (
            <Muted>{row.original.type === 'percentage' ? `${row.original.value}%` : `${row.original.value} (minor units)`}</Muted>
        ),
    },
    { accessorKey: 'apply_to', header: 'Applies to', cell: ({ row }) => <Muted>{row.original.apply_to}</Muted>, meta: { className: 'hidden md:table-cell' } },
    {
        id: 'period',
        header: 'Period',
        cell: ({ row }) => <Muted>{formatDate(row.original.start_at)} → {row.original.end_at ? formatDate(row.original.end_at) : 'no end'}</Muted>,
        meta: { className: 'hidden lg:table-cell' },
    },
    {
        accessorKey: 'usage_limit',
        header: 'Limit',
        cell: ({ row }) => <Muted>{row.original.usage_limit ?? '∞'}{row.original.usage_limit_per_user ? ' / user' : ''}</Muted>,
        meta: { className: 'hidden lg:table-cell' },
    },
    { id: 'status', header: 'Status', cell: ({ row }) => <EnabledBadge enabled={row.original.is_active} on="Active" off="Inactive" /> },
];

const routes: CrudRoutes = {
    store: (t) => discountRoutes.store.url({ current_team: t }),
    update: (t, id) => discountRoutes.update.url({ current_team: t, discount: id }),
    destroy: (t, id) => discountRoutes.destroy.url({ current_team: t, discount: id }),
};

export default function Index({ discounts, zones }: { discounts: Discount[]; zones: Zone[] }) {
    const fields: CrudField[] = [
        { name: 'code', label: 'Code', required: true },
        { name: 'zone_id', label: 'Zone', type: 'select', required: true, options: zones.map((z) => ({ value: z.id, label: z.name })) },
        { name: 'type', label: 'Type', type: 'select', required: true, options: opts([['percentage', 'Percentage'], ['fixed_amount', 'Fixed amount']]) },
        { name: 'value', label: 'Value', type: 'number', required: true, hint: 'Percent (0–100) or amount in minor units (500 = 5.00).' },
        { name: 'apply_to', label: 'Applies to', type: 'select', required: true, options: opts([['order', 'Entire order'], ['products', 'Specific products']]) },
        { name: 'eligibility', label: 'Eligibility', type: 'select', required: true, options: opts([['everyone', 'Everyone'], ['customers', 'Specific customers']]) },
        { name: 'min_required', label: 'Minimum requirement', type: 'select', required: true, options: opts([['none', 'None'], ['price', 'Minimum amount'], ['quantity', 'Minimum quantity']]) },
        { name: 'min_required_value', label: 'Minimum value', hint: 'Amount in minor units or quantity.' },
        { name: 'usage_limit', label: 'Usage limit', type: 'number' },
        { name: 'start_at', label: 'Starts at', type: 'datetime-local', required: true },
        { name: 'end_at', label: 'Ends at', type: 'datetime-local' },
        { name: 'usage_limit_per_user', label: 'Limit one use per customer', type: 'switch', span: 2 },
        { name: 'is_active', label: 'Active', type: 'switch', span: 2 },
    ];

    return (
        <CrudPage
            title="Discounts"
            singular="Discount"
            pages={crudPages('discounts')}
            description="Coupon codes and automatic promotions."
            icon={Ticket}
            permission="discount"
            items={discounts}
            columns={columns}
            fields={fields}
            defaults={{
                code: '', zone_id: '', type: 'percentage', value: '', apply_to: 'order', eligibility: 'everyone',
                min_required: 'none', min_required_value: '', usage_limit: '', usage_limit_per_user: false,
                start_at: '', end_at: '', is_active: true,
            }}
            routes={routes}
            itemName={(d) => d.code}
            searchText={(d) => `${d.code} ${d.zone?.name ?? ''}`}
            dialogClassName="sm:max-w-2xl"
        />
    );
}

Index.layout = { breadcrumbs: [{ title: 'Discounts', href: discountRoutes.index.url() }] };