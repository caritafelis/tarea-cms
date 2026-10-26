import type { ColumnDef } from '@tanstack/react-table';
import { Building2 } from 'lucide-react';
import supplierRoutes from '@/actions/App/Http/Controllers/Admin/SupplierController';
import { EnabledBadge, Muted, NameCell } from '@/components/admin/cells';
import { CrudPage, type CrudRoutes } from '@/components/admin/crud-page';
import type { CrudField } from '@/components/admin/form-fields';
import { crudPages } from '@/components/admin/resources';

type Supplier = {
    id: number;
    name: string;
    slug: string;
    email: string | null;
    phone: string | null;
    contact_name: string | null;
    website: string | null;
    description: string | null;
    notes: string | null;
    is_enabled: boolean;
};

const fields: CrudField[] = [
    { name: 'name', label: 'Name', required: true },
    { name: 'slug', label: 'Slug' },
    { name: 'contact_name', label: 'Contact name' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'phone', label: 'Phone' },
    { name: 'website', label: 'Website', type: 'url', placeholder: 'https://' },
    { name: 'description', label: 'Description', type: 'textarea', span: 2 },
    { name: 'notes', label: 'Internal notes', type: 'textarea', span: 2 },
    { name: 'is_enabled', label: 'Enabled', type: 'switch', span: 2 },
];

const columns: ColumnDef<Supplier>[] = [
    { accessorKey: 'name', header: 'Name', cell: ({ row }) => <NameCell title={row.original.name} subtitle={row.original.slug} /> },
    {
        id: 'contact',
        header: 'Contact',
        cell: ({ row }) => <NameCell title={row.original.contact_name ?? '—'} subtitle={row.original.email} />,
        meta: { className: 'hidden md:table-cell' },
    },
    {
        accessorKey: 'phone',
        header: 'Phone',
        cell: ({ row }) => <Muted>{row.original.phone ?? '—'}</Muted>,
        meta: { className: 'hidden lg:table-cell' },
    },
    { id: 'status', header: 'Status', cell: ({ row }) => <EnabledBadge enabled={row.original.is_enabled} /> },
];

const routes: CrudRoutes = {
    store: (t) => supplierRoutes.store.url({ current_team: t }),
    update: (t, id) => supplierRoutes.update.url({ current_team: t, supplier: id }),
    destroy: (t, id) => supplierRoutes.destroy.url({ current_team: t, supplier: id }),
};

export default function Index({ suppliers }: { suppliers: Supplier[] }) {
    return (
        <CrudPage
            title="Suppliers"
            singular="Supplier"
            pages={crudPages('suppliers')}
            description="Vendors you source your products from."
            icon={Building2}
            permission="supplier"
            items={suppliers}
            columns={columns}
            fields={fields}
            defaults={{
                name: '', slug: '', email: '', phone: '', contact_name: '',
                website: '', description: '', notes: '', is_enabled: true,
            }}
            routes={routes}
            itemName={(s) => s.name}
            searchText={(s) => `${s.name} ${s.contact_name ?? ''} ${s.email ?? ''}`}
        />
    );
}

Index.layout = { breadcrumbs: [{ title: 'Suppliers', href: supplierRoutes.index.url() }] };