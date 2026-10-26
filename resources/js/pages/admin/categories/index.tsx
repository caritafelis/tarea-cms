import type { ColumnDef } from '@tanstack/react-table';
import { Layers } from 'lucide-react';
import categoryRoutes from '@/actions/App/Http/Controllers/Admin/CategoryController';
import { EnabledBadge, Muted, NameCell } from '@/components/admin/cells';
import { CrudPage, type CrudRoutes } from '@/components/admin/crud-page';
import type { CrudField } from '@/components/admin/form-fields';
import { crudPages } from '@/components/admin/resources';

type Category = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    position: number | null;
    is_enabled: boolean;
    parent_id: number | null;
    parent?: { id: number; name: string } | null;
};

const columns: ColumnDef<Category>[] = [
    { accessorKey: 'name', header: 'Name', cell: ({ row }) => <NameCell title={row.original.name} subtitle={row.original.slug} /> },
    {
        id: 'parent',
        header: 'Parent',
        cell: ({ row }) => <Muted>{row.original.parent?.name ?? '—'}</Muted>,
        meta: { className: 'hidden md:table-cell' },
    },
    { accessorKey: 'position', header: 'Position', cell: ({ row }) => <Muted>{row.original.position ?? '—'}</Muted> },
    { id: 'status', header: 'Status', cell: ({ row }) => <EnabledBadge enabled={row.original.is_enabled} /> },
];

const routes: CrudRoutes = {
    store: (t) => categoryRoutes.store.url({ current_team: t }),
    update: (t, id) => categoryRoutes.update.url({ current_team: t, category: id }),
    destroy: (t, id) => categoryRoutes.destroy.url({ current_team: t, category: id }),
};

export default function Index({ categories }: { categories: Category[] }) {
    const fields = (editing: Category | null): CrudField[] => [
        { name: 'name', label: 'Name', required: true, span: 2 },
        { name: 'slug', label: 'Slug' },
        { name: 'position', label: 'Position', type: 'number' },
        {
            name: 'parent_id',
            label: 'Parent category',
            type: 'select',
            allowEmpty: true,
            span: 2,
            options: categories.filter((c) => c.id !== editing?.id).map((c) => ({ value: c.id, label: c.name })),
        },
        { name: 'description', label: 'Description', type: 'textarea', span: 2 },
        { name: 'is_enabled', label: 'Enabled', type: 'switch', span: 2 },
    ];

    return (
        <CrudPage
            title="Categories"
            singular="Category"
            pages={crudPages('categories')}
            description="Organize your catalog into a category tree."
            icon={Layers}
            permission="category"
            items={categories}
            columns={columns}
            fields={fields}
            defaults={{ name: '', slug: '', description: '', position: '', parent_id: '', is_enabled: true }}
            routes={routes}
            itemName={(c) => c.name}
            searchText={(c) => `${c.name} ${c.slug} ${c.parent?.name ?? ''}`}
        />
    );
}

Index.layout = { breadcrumbs: [{ title: 'Categories', href: categoryRoutes.index.url() }] };