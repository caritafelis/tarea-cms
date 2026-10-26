import type { ColumnDef } from '@tanstack/react-table';
import { MapPin } from 'lucide-react';
import zoneRoutes from '@/actions/App/Http/Controllers/Admin/ZoneController';
import { EnabledBadge, Muted, NameCell } from '@/components/admin/cells';
import { CrudPage, type CrudRoutes } from '@/components/admin/crud-page';
import type { CrudField } from '@/components/admin/form-fields';
import { crudPages } from '@/components/admin/resources';

type Currency = { id: number; code: string; name: string };
type Zone = {
    id: number;
    name: string;
    slug: string;
    code: string | null;
    is_enabled: boolean;
    currency_id: number;
    currency?: Currency | null;
};

const columns: ColumnDef<Zone>[] = [
    { accessorKey: 'name', header: 'Name', cell: ({ row }) => <NameCell title={row.original.name} subtitle={row.original.slug} /> },
    { accessorKey: 'code', header: 'Code', cell: ({ row }) => <Muted>{row.original.code ?? '—'}</Muted> },
    { id: 'currency', header: 'Currency', cell: ({ row }) => <Muted>{row.original.currency?.code ?? '—'}</Muted> },
    { id: 'status', header: 'Status', cell: ({ row }) => <EnabledBadge enabled={row.original.is_enabled} /> },
];

const routes: CrudRoutes = {
    store: (t) => zoneRoutes.store.url({ current_team: t }),
    update: (t, id) => zoneRoutes.update.url({ current_team: t, zone: id }),
    destroy: (t, id) => zoneRoutes.destroy.url({ current_team: t, zone: id }),
};

export default function Index({ zones, currencies }: { zones: Zone[]; currencies: Currency[] }) {
    const fields: CrudField[] = [
        { name: 'name', label: 'Name', required: true },
        { name: 'code', label: 'Code' },
        { name: 'slug', label: 'Slug' },
        {
            name: 'currency_id',
            label: 'Currency',
            type: 'select',
            required: true,
            options: currencies.map((c) => ({ value: c.id, label: `${c.code} — ${c.name}` })),
        },
        { name: 'is_enabled', label: 'Enabled', type: 'switch', span: 2 },
    ];

    return (
        <CrudPage
            title="Zones"
            singular="Zone"
            pages={crudPages('zones')}
            description="Selling regions with their own currency."
            icon={MapPin}
            permission="zone"
            items={zones}
            columns={columns}
            fields={fields}
            defaults={{ name: '', slug: '', code: '', currency_id: '', is_enabled: true }}
            routes={routes}
            itemName={(z) => z.name}
        />
    );
}

Index.layout = { breadcrumbs: [{ title: 'Zones', href: zoneRoutes.index.url() }] };