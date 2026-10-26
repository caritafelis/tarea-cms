import { router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Coins } from 'lucide-react';
import currencyRoutes from '@/actions/App/Http/Controllers/Admin/CurrencyController';
import { EnabledBadge, Muted, NameCell } from '@/components/admin/cells';
import { CrudPage, type CrudRoutes } from '@/components/admin/crud-page';
import type { CrudField } from '@/components/admin/form-fields';
import { Button } from '@/components/ui/button';
import { useCan } from '@/hooks/use-can';
import { useTeamSlug } from '@/hooks/use-team-slug';
import { normalize } from '@/routes/admin/currencies';
import { crudPages } from '@/components/admin/resources';

type Currency = {
    id: number;
    name: string;
    code: string;
    symbol: string;
    format: string;
    exchange_rate: number | null;
    is_enabled: boolean;
};

const fields: CrudField[] = [
    { name: 'name', label: 'Name', required: true },
    { name: 'code', label: 'Code', required: true, placeholder: 'USD' },
    { name: 'symbol', label: 'Symbol', required: true, placeholder: '$' },
    { name: 'format', label: 'Format', required: true, placeholder: '$1,000.00' },
    { name: 'exchange_rate', label: 'Exchange rate', type: 'number', step: 'any' },
    { name: 'is_enabled', label: 'Enabled', type: 'switch', span: 2 },
];

const columns: ColumnDef<Currency>[] = [
    { accessorKey: 'code', header: 'Currency', cell: ({ row }) => <NameCell title={row.original.code} subtitle={row.original.name} /> },
    { accessorKey: 'symbol', header: 'Symbol', cell: ({ row }) => <Muted>{row.original.symbol}</Muted> },
    { accessorKey: 'format', header: 'Format', cell: ({ row }) => <Muted>{row.original.format}</Muted>, meta: { className: 'hidden md:table-cell' } },
    { accessorKey: 'exchange_rate', header: 'Rate', cell: ({ row }) => <Muted>{row.original.exchange_rate ?? '—'}</Muted> },
    { id: 'status', header: 'Status', cell: ({ row }) => <EnabledBadge enabled={row.original.is_enabled} /> },
];

const routes: CrudRoutes = {
    store: (t) => currencyRoutes.store.url({ current_team: t }),
    update: (t, id) => currencyRoutes.update.url({ current_team: t, currency: id }),
    destroy: (t, id) => currencyRoutes.destroy.url({ current_team: t, currency: id }),
};

export default function Index({ currencies }: { currencies: Currency[] }) {
    const team = useTeamSlug();
    const can = useCan();

    return (
        <CrudPage
            title="Currencies"
            singular="Currency"
            pages={crudPages('currencies')}
            description="Currencies available across your stores and zones."
            icon={Coins}
            permission="currency"
            items={currencies}
            columns={columns}
            fields={fields}
            defaults={{ name: '', code: '', symbol: '', format: '', exchange_rate: '', is_enabled: true }}
            routes={routes}
            itemName={(c) => `${c.code} — ${c.name}`}
            headerActions={
                can('update_currency') ? (
                    <Button variant="outline" onClick={() => router.post(normalize(team).url, {}, { preserveScroll: true })}>
                        Normalize records
                    </Button>
                ) : undefined
            }
        />
    );
}

Index.layout = { breadcrumbs: [{ title: 'Currencies', href: currencyRoutes.index.url() }] };