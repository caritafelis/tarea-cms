import type { ColumnDef } from '@tanstack/react-table';
import { Award } from 'lucide-react';
import brandRoutes from '@/actions/App/Http/Controllers/Admin/BrandController';
import { EnabledBadge, Muted, NameCell } from '@/components/admin/cells';
import { CrudPage, type CrudRoutes } from '@/components/admin/crud-page';
import type { CrudField } from '@/components/admin/form-fields';

type Brand = {
    id: number;
    name: string;
    slug: string;
    website: string | null;
    description: string | null;
    position: number | null;
    is_enabled: boolean;
};

const fields: CrudField[] = [
    { name: 'name', label: 'Name', required: true, span: 2 },
    { name: 'slug', label: 'Slug', hint: 'Auto-generated when empty.' },
    { name: 'website', label: 'Website', type: 'url', placeholder: 'https://' },
    { name: 'position', label: 'Position', type: 'number' },
    { name: 'description', label: 'Description', type: 'textarea', span: 2 },
    { name: 'is_enabled', label: 'Enabled', type: 'switch', span: 2 },
];

const columns: ColumnDef<Brand>[] = [
    { accessorKey: 'name', header: 'Name', cell: ({ row }) => <NameCell title={row.original.name} subtitle={row.original.slug} /> },
    {
        accessorKey: 'website',
        header: 'Website',
        cell: ({ row }) => <Muted>{row.original.website ?? '—'}</Muted>,
        meta: { className: 'hidden md:table-cell' },
    },
    { accessorKey: 'position', header: 'Position', cell: ({ row }) => <Muted>{row.original.position ?? '—'}</Muted> },
    { id: 'status', header: 'Status', cell: ({ row }) => <EnabledBadge enabled={row.original.is_enabled} /> },
];

const routes: CrudRoutes = {
    store: (t) => brandRoutes.store.url({ current_team: t }),
    update: (t, id) => brandRoutes.update.url({ current_team: t, brand: id }),
    destroy: (t, id) => brandRoutes.destroy.url({ current_team: t, brand: id }),
};

export default function Index({ brands }: { brands: Brand[] }) {
    return (
        <CrudPage
            title="Brands"
            singular="Brand"
            description="Manufacturers and labels your products belong to."
            icon={Award}
            permission="brand"
            items={brands}
            columns={columns}
            fields={fields}
            defaults={{ name: '', slug: '', website: '', description: '', position: '', is_enabled: true }}
            routes={routes}
            itemName={(b) => b.name}
            searchText={(b) => `${b.name} ${b.slug}`}
        />
    );
}

Index.layout = { breadcrumbs: [{ title: 'Brands', href: brandRoutes.index.url() }] };