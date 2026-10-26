import type { ColumnDef } from '@tanstack/react-table';
import { Scale } from 'lucide-react';
import legalRoutes from '@/actions/App/Http/Controllers/Admin/LegalController';
import { EnabledBadge, Muted, NameCell } from '@/components/admin/cells';
import { CrudPage, type CrudRoutes } from '@/components/admin/crud-page';
import type { CrudField } from '@/components/admin/form-fields';
import { formatDate } from '@/lib/format';
import { crudPages } from '@/components/admin/resources';

type Legal = {
    id: number;
    title: string;
    slug: string;
    content: string | null;
    is_enabled: boolean;
    updated_at: string;
};

const fields: CrudField[] = [
    { name: 'title', label: 'Title', required: true },
    { name: 'slug', label: 'Slug', hint: 'e.g. terms-and-conditions' },
    { name: 'content', label: 'Content', type: 'textarea', rows: 12, span: 2 },
    { name: 'is_enabled', label: 'Published', type: 'switch', span: 2 },
];

const columns: ColumnDef<Legal>[] = [
    { accessorKey: 'title', header: 'Title', cell: ({ row }) => <NameCell title={row.original.title} subtitle={`/${row.original.slug}`} /> },
    {
        accessorKey: 'updated_at',
        header: 'Updated',
        cell: ({ row }) => <Muted>{formatDate(row.original.updated_at)}</Muted>,
        meta: { className: 'hidden md:table-cell' },
    },
    { id: 'status', header: 'Status', cell: ({ row }) => <EnabledBadge enabled={row.original.is_enabled} on="Published" off="Draft" /> },
];

const routes: CrudRoutes = {
    store: (t) => legalRoutes.store.url({ current_team: t }),
    update: (t, id) => legalRoutes.update.url({ current_team: t, legal: id }),
    destroy: (t, id) => legalRoutes.destroy.url({ current_team: t, legal: id }),
};

export default function Index({ legals }: { legals: Legal[] }) {
    return (
        <CrudPage
            title="Legals"
            singular="Legal page"
            pages={crudPages('legals')}
            description="Terms, privacy policy and other legal documents."
            icon={Scale}
            permission="legal"
            items={legals}
            columns={columns}
            fields={fields}
            defaults={{ title: '', slug: '', content: '', is_enabled: true }}
            routes={routes}
            itemName={(l) => l.title}
            dialogClassName="sm:max-w-3xl"
        />
    );
}

Index.layout = { breadcrumbs: [{ title: 'Legals', href: legalRoutes.index.url() }] };